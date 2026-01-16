import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LLM_CLIENT, LlmClient } from "./llm/llmClient.interface";
import { ExtractionStatus } from "@vambe/shared";

const SCHEMA_VERSION = "1.0.0";
const PROMPT_VERSION = "1.0.0";
const MODEL_NAME = "gemini-1.5-flash-latest";

@Injectable()
export class ExtractService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llmClient: LlmClient
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
      orderBy: { createdAt: "desc" },
    });

    if (!extraction) {
      return null;
    }

    return {
      id: extraction.id,
      meetingId: extraction.meetingId,
      extraction: JSON.parse(extraction.resultJson),
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

    for (const meeting of meetingsWithoutExtraction) {
      const result = await this.extractFromMeeting(meeting.id);
      if (result?.status === ExtractionStatus.SUCCESS) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  async retryFailedExtractions() {
    // Buscar reuniones que tienen extracciones fallidas
    const failedExtractions = await this.prisma.extraction.findMany({
      where: {
        status: ExtractionStatus.FAILED,
      },
      include: {
        meeting: true,
      },
    });

    const results = {
      total: failedExtractions.length,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const failedExtraction of failedExtractions) {
      // Verificar si ya hay una extracción exitosa más reciente para esta reunión
      const latestExtraction = await this.prisma.extraction.findFirst({
        where: {
          meetingId: failedExtraction.meetingId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Si la última extracción es exitosa, saltar esta reunión
      if (latestExtraction && latestExtraction.status === ExtractionStatus.SUCCESS) {
        results.skipped++;
        continue;
      }

      // Reintentar la extracción
      const result = await this.extractFromMeeting(failedExtraction.meetingId);
      if (result?.status === ExtractionStatus.SUCCESS) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    return results;
  }
}
