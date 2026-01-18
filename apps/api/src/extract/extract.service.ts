import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LLM_CLIENT, LlmClient } from "./llm/llmClient.interface";
import { ExtractionStatus } from "@vambe/shared";
import { ExtractionParser } from "./llm/extraction.parser";

const SCHEMA_VERSION = "1.0.0";
const PROMPT_VERSION = "1.0.0";
const MODEL_NAME = "gemini-1.5-flash-latest";

@Injectable()
export class ExtractService {
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
      const extraction = await this.llmClient.extractFromTranscript(meeting.transcript);

      const saved = await this.prisma.extraction.create({
        data: {
          meetingId: meeting.id,
          resultJson: JSON.stringify(extraction),
          model: MODEL_NAME,
          promptVersion: PROMPT_VERSION,
          schemaVersion: SCHEMA_VERSION,
          status: ExtractionStatus.SUCCESS,
        },
      });

      await this.extractionParser.parseAndSave(saved.id, extraction);

      return {
        id: saved.id,
        meetingId: saved.meetingId,
        extraction,
        status: saved.status,
      };
    } catch (error) {
      const saved = await this.prisma.extraction.create({
        data: {
          meetingId: meeting.id,
          resultJson: "{}",
          model: MODEL_NAME,
          promptVersion: PROMPT_VERSION,
          schemaVersion: SCHEMA_VERSION,
          status: ExtractionStatus.FAILED,
          rawModelOutput: String(error),
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

    const { mapExtractionDataToExtraction } = await import("./llm/extraction.mapper");
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
}
