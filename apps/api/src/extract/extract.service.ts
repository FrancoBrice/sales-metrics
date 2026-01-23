import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExtractionStatus, LeadSource, Integrations, Volume, Extraction } from "@vambe/shared";
import { LlmExtractionResult, DeepSeekClient, ExtractionParser, mapExtractionDataToExtraction } from "./llm";
import { detectLeadSource, detectVolume, detectIntegrations } from "./deterministic";
import { processInBatches } from "../common/helpers/batching.helper";
import { CONCURRENCY_LIMIT, MIN_CONFIDENCE_THRESHOLD, HOURS_24_MS, MAX_EXTRACTION_RETRIES } from "../common/constants";
import { ExtractionResult, ExtractionProgress, DeterministicResult, ErrorWithMetadata } from "./types";

@Injectable()
export class ExtractService {
  private readonly logger = new Logger(ExtractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deepSeekClient: DeepSeekClient,
    private readonly extractionParser: ExtractionParser
  ) { }

  async extractFromMeeting(meetingId: string): Promise<ExtractionResult> {
    const meeting = await this.findMeetingOrThrow(meetingId);

    try {
      const deterministicResults = this.runDeterministicExtraction(meeting.transcript);
      const llmResult = await this.deepSeekClient.extractFromTranscript(meeting.transcript, deterministicResults);
      const extraction = this.mergeResults(deterministicResults, llmResult.extraction);
      const saved = await this.saveSuccess(meeting.id, llmResult, extraction);

      return { id: saved.id, meetingId: saved.meetingId, extraction, status: saved.status as ExtractionStatus };
    } catch (error: unknown) {
      return this.handleError(meeting.id, error);
    }
  }

  async getExtractionByMeetingId(meetingId: string) {
    const extraction = await this.prisma.extraction.findFirst({
      where: { meetingId },
      include: { data: true },
      orderBy: { createdAt: "desc" },
    });

    if (!extraction) throw new Error(`Extraction for meeting ${meetingId} not found`);

    const extractionData = mapExtractionDataToExtraction(extraction.data);
    if (!extractionData) throw new Error(`Extraction data for meeting ${meetingId} is invalid`);

    return {
      id: extraction.id,
      meetingId: extraction.meetingId,
      extraction: extractionData,
      status: extraction.status,
      model: extraction.model,
      createdAt: extraction.createdAt,
    };
  }

  async processAllPendingExtractions() {
    const [pendingMeetings, retryableMeetingIds] = await Promise.all([
      this.findPendingMeetings(),
      this.findRetryableMeetingIds(),
    ]);

    const allMeetingIds = [...pendingMeetings.map((m) => m.id), ...retryableMeetingIds];

    const stats = {
      total: allMeetingIds.length,
      success: 0,
      failed: 0,
      pending: pendingMeetings.length,
      retried: retryableMeetingIds.length,
    };

    if (allMeetingIds.length > 0) {
      this.processInBackground(allMeetingIds);
    }

    return stats;
  }

  async extractAllPendingAndFailed() {
    return this.processAllPendingExtractions();
  }

  async getExtractionProgress(): Promise<ExtractionProgress> {
    const [pendingMeetings, retryableMeetingIds] = await Promise.all([
      this.findPendingMeetings(),
      this.findRetryableMeetingIds(),
    ]);

    const recentMeetingIds = await this.getRecentExtractionMeetingIds();
    const allMeetingIds = new Set([
      ...pendingMeetings.map((m) => m.id),
      ...retryableMeetingIds,
      ...recentMeetingIds,
    ]);

    if (allMeetingIds.size === 0) {
      return { total: 0, completed: 0, success: 0, failed: 0, pending: 0, retried: 0 };
    }

    const statusByMeeting = await this.getLatestStatusByMeetingId(Array.from(allMeetingIds));
    const statuses = Array.from(statusByMeeting.values());
    const completed = statuses.filter((s) => s === ExtractionStatus.SUCCESS || s === ExtractionStatus.FAILED);

    return {
      total: allMeetingIds.size,
      completed: completed.length,
      success: completed.filter((s) => s === ExtractionStatus.SUCCESS).length,
      failed: completed.filter((s) => s === ExtractionStatus.FAILED).length,
      pending: pendingMeetings.length,
      retried: retryableMeetingIds.length,
    };
  }

  private async findMeetingOrThrow(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { customer: true },
    });
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);
    return meeting;
  }

  private async findPendingMeetings() {
    return this.prisma.meeting.findMany({
      where: { extractions: { none: {} } },
      select: { id: true },
    });
  }

  private async findRetryableMeetingIds(): Promise<string[]> {
    const failedExtractions = await this.prisma.extraction.findMany({
      where: { status: ExtractionStatus.FAILED },
      select: { meetingId: true },
      distinct: ["meetingId"],
    });

    if (failedExtractions.length === 0) return [];

    const meetingIds = failedExtractions.map((e) => e.meetingId);
    const allExtractions = await this.prisma.extraction.findMany({
      where: { meetingId: { in: meetingIds } },
      select: { meetingId: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    const failedCounts = new Map<string, { latestStatus: string; count: number }>();
    for (const e of allExtractions) {
      const existing = failedCounts.get(e.meetingId);
      if (!existing) {
        failedCounts.set(e.meetingId, { latestStatus: e.status, count: e.status === ExtractionStatus.FAILED ? 1 : 0 });
      } else if (e.status === ExtractionStatus.FAILED) {
        existing.count++;
      }
    }

    return Array.from(failedCounts.entries())
      .filter(([, data]) => data.latestStatus === ExtractionStatus.FAILED && data.count < MAX_EXTRACTION_RETRIES)
      .map(([id]) => id);
  }

  private async getRecentExtractionMeetingIds(): Promise<string[]> {
    const extractions = await this.prisma.extraction.findMany({
      where: { createdAt: { gte: new Date(Date.now() - HOURS_24_MS) } },
      select: { meetingId: true },
    });
    return extractions.map((e) => e.meetingId);
  }

  private async getLatestStatusByMeetingId(meetingIds: string[]): Promise<Map<string, string>> {
    const extractions = await this.prisma.extraction.findMany({
      where: { meetingId: { in: meetingIds } },
      select: { meetingId: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    const result = new Map<string, string>();
    for (const e of extractions) {
      if (!result.has(e.meetingId)) result.set(e.meetingId, e.status);
    }
    return result;
  }


  private runDeterministicExtraction(transcript: string): DeterministicResult {
    const leadSource = detectLeadSource(transcript);
    const volume = detectVolume(transcript);
    const integrations = detectIntegrations(transcript);

    return {
      leadSource: leadSource.confidence >= MIN_CONFIDENCE_THRESHOLD ? leadSource.source : null,
      volume: volume.confidence >= MIN_CONFIDENCE_THRESHOLD ? volume.volume : null,
      integrations: integrations.confidence >= MIN_CONFIDENCE_THRESHOLD ? integrations.integrations : [],
      confidence: {
        leadSource: leadSource.confidence,
        volume: volume.confidence,
        integrations: integrations.confidence,
      },
    };
  }

  private mergeResults(deterministic: DeterministicResult, llm: Extraction): Extraction {
    return {
      ...llm,
      leadSource: deterministic.leadSource || llm.leadSource || null,
      volume: deterministic.volume || llm.volume || null,
      integrations: deterministic.integrations.length > 0
        ? [...new Set([...deterministic.integrations, ...(llm.integrations || [])])]
        : llm.integrations || [],
    };
  }

  private async saveSuccess(meetingId: string, llmResult: LlmExtractionResult, extraction: Extraction) {
    const model = llmResult.metadata?.model || "unknown";

    const saved = await this.prisma.extraction.upsert({
      where: { meetingId },
      update: { model, status: ExtractionStatus.SUCCESS },
      create: { meetingId, model, status: ExtractionStatus.SUCCESS },
    });

    await this.logApiCall(saved.id, llmResult, ExtractionStatus.SUCCESS);
    await this.extractionParser.parseAndSave(saved.id, extraction);

    return saved;
  }

  private async handleError(meetingId: string, error: unknown): Promise<ExtractionResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Extraction failed for meeting ${meetingId}: ${errorMessage}`);

    const metadata = (error as ErrorWithMetadata)?.metadata;
    const model = metadata?.model || "unknown";

    const saved = await this.prisma.extraction.upsert({
      where: { meetingId },
      update: { model, status: ExtractionStatus.FAILED },
      create: { meetingId, model, status: ExtractionStatus.FAILED },
    });

    await this.logApiCall(saved.id, { metadata, rawResponse: this.buildErrorResponse(error, model) } as LlmExtractionResult, ExtractionStatus.FAILED, String(error));

    return { id: saved.id, meetingId: saved.meetingId, extraction: null, status: ExtractionStatus.FAILED, error: String(error) };
  }

  private async logApiCall(extractionId: string, result: LlmExtractionResult, status: ExtractionStatus, error?: string) {
    const meta = result.metadata;
    await this.prisma.llmApiLog.create({
      data: {
        extractionId,
        provider: meta?.provider || "unknown",
        model: meta?.model || "unknown",
        status,
        response: result.rawResponse,
        error,
        durationMs: meta?.durationMs,
        promptTokens: meta?.promptTokens,
        completionTokens: meta?.completionTokens,
        totalTokens: meta?.totalTokens,
      },
    });
  }

  private buildErrorResponse(error: unknown, model: string): string {
    return (error as ErrorWithMetadata)?.rawResponse || JSON.stringify({
      error: String(error),
      model,
      timestamp: new Date().toISOString(),
    });
  }

  private processInBackground(meetingIds: string[]): void {
    processInBatches(meetingIds, CONCURRENCY_LIMIT, (id) => this.extractFromMeeting(id))
      .then((results) => {
        const success = results.filter((r) => r.status === "fulfilled" && r.value?.status === ExtractionStatus.SUCCESS).length;
        this.logger.log(`Background extraction: ${success} success, ${results.length - success} failed`);
      })
      .catch((err) => this.logger.error("Background extraction failed", err));
  }
}
