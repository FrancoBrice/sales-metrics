import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LlmExtractionResult } from "./llm";
import { ExtractionStatus, LeadSource, Integrations, Volume, Extraction } from "@vambe/shared";
import { ExtractionParser, DeepSeekClient, mapExtractionDataToExtraction } from "./llm";
import { detectLeadSource, detectVolume, detectIntegrations } from "./deterministic";
import { processInBatches } from "../common/helpers/batching.helper";
import { CONCURRENCY_LIMIT, MIN_CONFIDENCE_THRESHOLD } from "../common/constants";

@Injectable()
export class ExtractService {
  private readonly logger = new Logger(ExtractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deepSeekClient: DeepSeekClient,
    private readonly extractionParser: ExtractionParser
  ) { }

  async extractFromMeeting(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { customer: true },
    });

    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    try {
      const deterministicResults = this.runDeterministicExtraction(meeting.transcript);

      const llmResult = await this.deepSeekClient.extractFromTranscript(
        meeting.transcript,
        deterministicResults
      );

      const extraction = this.mergeExtractionResults(deterministicResults, llmResult.extraction);
      const modelName = llmResult.metadata?.model || "unknown";
      const rawResponse = llmResult.rawResponse;

      const saved = await this.prisma.extraction.upsert({
        where: { meetingId: meeting.id },
        update: {
          model: modelName,
          status: ExtractionStatus.SUCCESS,
        },
        create: {
          meetingId: meeting.id,
          model: modelName,
          status: ExtractionStatus.SUCCESS,
        },
      });

      await this.prisma.llmApiLog.create({
        data: {
          extractionId: saved.id,
          provider: llmResult.metadata?.provider || "unknown",
          model: modelName,
          status: ExtractionStatus.SUCCESS,
          response: rawResponse,
          durationMs: llmResult.metadata?.durationMs,
          promptTokens: llmResult.metadata?.promptTokens,
          completionTokens: llmResult.metadata?.completionTokens,
          totalTokens: llmResult.metadata?.totalTokens,
        },
      });

      await this.extractionParser.parseAndSave(saved.id, extraction);

      return {
        id: saved.id,
        meetingId: saved.meetingId,
        extraction,
        status: saved.status,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Extraction failed for meeting ${meetingId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);

      const errorWithMetadata = error as { metadata?: { model?: string; provider?: string; durationMs?: number; promptTokens?: number; completionTokens?: number; totalTokens?: number }; rawResponse?: string };
      const modelName = errorWithMetadata?.metadata?.model || "unknown";
      const rawResponse = errorWithMetadata?.rawResponse || JSON.stringify({
        error: String(error),
        model: modelName,
        timestamp: new Date().toISOString(),
      });

      const saved = await this.prisma.extraction.upsert({
        where: { meetingId: meeting.id },
        update: {
          model: modelName,
          status: ExtractionStatus.FAILED,
        },
        create: {
          meetingId: meeting.id,
          model: modelName,
          status: ExtractionStatus.FAILED,
        },
      });

      const existingLog = await this.prisma.llmApiLog.findFirst({
        where: {
          extractionId: saved.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!existingLog || existingLog.response !== rawResponse) {
        await this.prisma.llmApiLog.create({
          data: {
            extractionId: saved.id,
            provider: errorWithMetadata?.metadata?.provider || "unknown",
            model: modelName,
            status: ExtractionStatus.FAILED,
            response: rawResponse,
            error: String(error),
            durationMs: errorWithMetadata?.metadata?.durationMs,
            promptTokens: errorWithMetadata?.metadata?.promptTokens,
            completionTokens: errorWithMetadata?.metadata?.completionTokens,
            totalTokens: errorWithMetadata?.metadata?.totalTokens,
          },
        });
      }

      return {
        id: saved.id,
        meetingId: saved.meetingId,
        extraction: null,
        status: saved.status,
        error: String(error),
      };
    }
  }

  async getExtractionByMeetingId(meetingId: string) {
    const extraction = await this.prisma.extraction.findFirst({
      where: { meetingId },
      include: { data: true },
      orderBy: { createdAt: "desc" },
    });

    if (!extraction) {
      throw new Error(`Extraction for meeting ${meetingId} not found`);
    }

    const extractionData = mapExtractionDataToExtraction(extraction.data);

    if (!extractionData) {
      throw new Error(`Extraction data for meeting ${meetingId} is invalid`);
    }

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
    const pendingMeetings = await this.findPendingMeetings();
    const failedMeetingIds = await this.findFailedMeetings();

    const allMeetingIds = [
      ...pendingMeetings.map((m) => m.id),
      ...failedMeetingIds,
    ];

    const stats = {
      total: allMeetingIds.length,
      success: 0,
      failed: 0,
      pending: pendingMeetings.length,
      retried: failedMeetingIds.length,
    };

    if (allMeetingIds.length === 0) {
      return stats;
    }

    this.processMeetingsInBackground(allMeetingIds).catch((error) => {
      this.logger.error("Background extraction processing failed", error instanceof Error ? error.stack : undefined);
    });

    return stats;
  }

  async retryFailedExtractions() {
    const failedMeetingIds = await this.findFailedMeetings();

    const stats = {
      total: failedMeetingIds.length,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    if (failedMeetingIds.length === 0) {
      return stats;
    }

    const batchResults = await processInBatches(
      failedMeetingIds,
      CONCURRENCY_LIMIT,
      (meetingId) => this.extractFromMeeting(meetingId)
    );

    return this.calculateExtractionStats(batchResults, stats);
  }

  async extractAllPending() {
    const pendingMeetings = await this.findPendingMeetings();

    const stats = {
      total: pendingMeetings.length,
      success: 0,
      failed: 0,
    };

    if (pendingMeetings.length === 0) {
      return stats;
    }

    const batchResults = await processInBatches(
      pendingMeetings,
      CONCURRENCY_LIMIT,
      (meeting) => this.extractFromMeeting(meeting.id)
    );

    return this.calculateExtractionStats(batchResults, stats);
  }

  async extractAllPendingAndFailed() {
    return this.processAllPendingExtractions();
  }

  async getExtractionProgress() {
    const pendingMeetings = await this.findPendingMeetings();
    const failedMeetingIds = await this.findFailedMeetings();

    const allMeetingIds = [
      ...pendingMeetings.map((m) => m.id),
      ...failedMeetingIds,
    ];

    const recentExtractions = await this.prisma.extraction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: {
        meetingId: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const recentMeetingIds = new Set(recentExtractions.map((e) => e.meetingId));
    const allRelevantMeetingIds = new Set([
      ...allMeetingIds,
      ...Array.from(recentMeetingIds),
    ]);

    const total = allRelevantMeetingIds.size;

    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        success: 0,
        failed: 0,
        pending: pendingMeetings.length,
        retried: failedMeetingIds.length,
      };
    }

    const latestExtractions = await Promise.all(
      Array.from(allRelevantMeetingIds).map(async (meetingId) => {
        return await this.prisma.extraction.findFirst({
          where: {
            meetingId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            meetingId: true,
            status: true,
          },
        });
      })
    );

    const completedExtractions = latestExtractions.filter(
      (e): e is { meetingId: string; status: string } =>
        e !== null && (e.status === ExtractionStatus.SUCCESS || e.status === ExtractionStatus.FAILED)
    );

    const completed = completedExtractions.length;
    const success = completedExtractions.filter((e) => e.status === ExtractionStatus.SUCCESS).length;
    const failed = completedExtractions.filter((e) => e.status === ExtractionStatus.FAILED).length;

    return {
      total,
      completed,
      success,
      failed,
      pending: pendingMeetings.length,
      retried: failedMeetingIds.length,
    };
  }

  private async findPendingMeetings() {
    return this.prisma.meeting.findMany({
      where: {
        extractions: {
          none: {},
        },
      },
    });
  }

  private async findFailedMeetings(): Promise<string[]> {
    const failedExtractions = await this.prisma.extraction.findMany({
      where: {
        status: ExtractionStatus.FAILED,
      },
      select: {
        meetingId: true,
        createdAt: true,
      },
      distinct: ["meetingId"],
      orderBy: {
        createdAt: "desc",
      },
    });

    if (failedExtractions.length === 0) {
      return [];
    }

    const meetingIds = failedExtractions.map((e) => e.meetingId);

    const allExtractions = await this.prisma.extraction.findMany({
      where: {
        meetingId: { in: meetingIds },
      },
      select: {
        meetingId: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const latestByMeetingId = new Map<string, { status: string; createdAt: Date }>();
    for (const extraction of allExtractions) {
      if (!latestByMeetingId.has(extraction.meetingId)) {
        latestByMeetingId.set(extraction.meetingId, {
          status: extraction.status,
          createdAt: extraction.createdAt,
        });
      }
    }

    return Array.from(latestByMeetingId.entries())
      .filter(([_, extraction]) => extraction.status === ExtractionStatus.FAILED)
      .map(([meetingId]) => meetingId);
  }

  private async processMeetingsInBackground(meetingIds: string[]) {
    const batchResults = await processInBatches(
      meetingIds,
      CONCURRENCY_LIMIT,
      (meetingId) => this.extractFromMeeting(meetingId)
    );

    const stats = this.calculateExtractionStats(batchResults, { success: 0, failed: 0 });
    this.logger.log(`Background extraction completed: ${stats.success} success, ${stats.failed} failed`);
  }

  private calculateExtractionStats(
    batchResults: Array<{
      status: "fulfilled" | "rejected";
      value?: { status?: string } | null;
      reason?: unknown
    }>,
    initialStats: { success: number; failed: number; skipped?: number }
  ) {
    const stats = { ...initialStats };

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value?.status === ExtractionStatus.SUCCESS) {
        stats.success++;
      } else {
        stats.failed++;
      }
    }

    return stats;
  }

  private runDeterministicExtraction(transcript: string) {
    const leadSourceResult = detectLeadSource(transcript);
    const volumeResult = detectVolume(transcript);
    const integrationsResult = detectIntegrations(transcript);

    return {
      leadSource: leadSourceResult.confidence >= MIN_CONFIDENCE_THRESHOLD
        ? leadSourceResult.source
        : null,
      volume: volumeResult.confidence >= MIN_CONFIDENCE_THRESHOLD
        ? volumeResult.volume
        : null,
      integrations: integrationsResult.confidence >= MIN_CONFIDENCE_THRESHOLD
        ? integrationsResult.integrations
        : [],
      confidence: {
        leadSource: leadSourceResult.confidence,
        volume: volumeResult.confidence,
        integrations: integrationsResult.confidence,
      },
    };
  }

  private mergeExtractionResults(
    deterministic: {
      leadSource: LeadSource | null;
      volume: Volume | null;
      integrations: Integrations[];
    },
    llm: Extraction
  ): Extraction {
    return {
      ...llm,
      leadSource: deterministic.leadSource || llm.leadSource || null,
      volume: deterministic.volume || llm.volume || null,
      integrations: deterministic.integrations.length > 0
        ? [...new Set([...deterministic.integrations, ...(llm.integrations || [])])]
        : (llm.integrations || []),
    };
  }
}
