import { Injectable, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LLM_CLIENT, LlmClient } from "./llm";
import { ExtractionStatus, LeadSource, Integrations, Volume, Extraction } from "@vambe/shared";
import { ExtractionParser, mapExtractionDataToExtraction } from "./llm";
import { detectLeadSource, detectVolume, detectIntegrations } from "./deterministic";

const MIN_CONFIDENCE_THRESHOLD = 0.7;

@Injectable()
export class ExtractService {
  private readonly logger = new Logger(ExtractService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llmClient: LlmClient,
    private readonly extractionParser: ExtractionParser
  ) { }

  async extractFromMeeting(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { customer: true },
    });

    if (!meeting) {
      return null;
    }

    try {
      const deterministicResults = this.runDeterministicExtraction(meeting.transcript);
      const llmResult = await this.llmClient.extractFromTranscript(
        meeting.transcript,
        deterministicResults
      );
      const extraction = this.mergeExtractionResults(deterministicResults, llmResult.extraction);
      const modelName = llmResult.metadata?.model || "unknown";

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
          response: llmResult.rawResponse,
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
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Extraction failed for meeting ${meetingId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);

      const modelName = error?.metadata?.model || "unknown";
      const rawResponse = error?.rawResponse || JSON.stringify({
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

      await this.prisma.llmApiLog.create({
        data: {
          extractionId: saved.id,
          provider: error?.metadata?.provider || "unknown",
          model: modelName,
          status: ExtractionStatus.FAILED,
          response: rawResponse,
          error: String(error),
          durationMs: error?.metadata?.durationMs,
        },
      });

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
      return null;
    }

    const extractionData = mapExtractionDataToExtraction(extraction.data);

    if (!extractionData) {
      return null;
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

  async extractAllPending() {
    const meetingsWithoutExtraction = await this.prisma.meeting.findMany({
      where: {
        extractions: {
          none: {},
        },
      },
    });

    const results = {
      total: meetingsWithoutExtraction.length,
      success: 0,
      failed: 0,
    };

    const concurrencyLimit = 10;
    const batches = [];
    for (let i = 0; i < meetingsWithoutExtraction.length; i += concurrencyLimit) {
      batches.push(meetingsWithoutExtraction.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((meeting) => this.extractFromMeeting(meeting.id))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value?.status === ExtractionStatus.SUCCESS) {
          results.success++;
        } else {
          results.failed++;
        }
      }
    }

    return results;
  }

  async extractAllPendingAndFailed() {
    const meetingsWithoutExtraction = await this.prisma.meeting.findMany({
      where: {
        extractions: {
          none: {},
        },
      },
    });

    const failedExtractions = await this.prisma.extraction.findMany({
      where: {
        status: ExtractionStatus.FAILED,
      },
      include: {
        meeting: true,
      },
    });

    const meetingIdsToRetry: string[] = [];

    for (const failedExtraction of failedExtractions) {
      const latestExtraction = await this.prisma.extraction.findFirst({
        where: {
          meetingId: failedExtraction.meetingId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (latestExtraction && latestExtraction.status === ExtractionStatus.SUCCESS) {
        continue;
      }

      meetingIdsToRetry.push(failedExtraction.meetingId);
    }

    const allMeetingIds = [
      ...meetingsWithoutExtraction.map((m) => m.id),
      ...meetingIdsToRetry,
    ];

    const results = {
      total: allMeetingIds.length,
      success: 0,
      failed: 0,
      pending: meetingsWithoutExtraction.length,
      retried: meetingIdsToRetry.length,
    };

    if (allMeetingIds.length === 0) {
      return results;
    }

    const concurrencyLimit = 10;
    const batches = [];
    for (let i = 0; i < allMeetingIds.length; i += concurrencyLimit) {
      batches.push(allMeetingIds.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((meetingId) => this.extractFromMeeting(meetingId))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value?.status === ExtractionStatus.SUCCESS) {
          results.success++;
        } else {
          results.failed++;
        }
      }
    }

    return results;
  }

  async retryFailedExtractions() {
    const failedExtractions = await this.prisma.extraction.findMany({
      where: {
        status: ExtractionStatus.FAILED,
      },
      include: {
        meeting: true,
      },
    });

    const meetingIdsToRetry: string[] = [];

    for (const failedExtraction of failedExtractions) {
      const latestExtraction = await this.prisma.extraction.findFirst({
        where: {
          meetingId: failedExtraction.meetingId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (latestExtraction && latestExtraction.status === ExtractionStatus.SUCCESS) {
        continue;
      }

      meetingIdsToRetry.push(failedExtraction.meetingId);
    }

    const results = {
      total: failedExtractions.length,
      success: 0,
      failed: 0,
      skipped: failedExtractions.length - meetingIdsToRetry.length,
    };

    const concurrencyLimit = 10;
    const batches = [];
    for (let i = 0; i < meetingIdsToRetry.length; i += concurrencyLimit) {
      batches.push(meetingIdsToRetry.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map((meetingId) => this.extractFromMeeting(meetingId))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value?.status === ExtractionStatus.SUCCESS) {
          results.success++;
        } else {
          results.failed++;
        }
      }
    }

    return results;
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
