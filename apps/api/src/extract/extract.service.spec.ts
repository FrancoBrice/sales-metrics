import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExtractService } from "./extract.service";
import { PrismaService } from "../prisma/prisma.service";
import { DeepSeekClient } from "./llm/clients/deepseekClient";
import { ExtractionParser } from "./llm/services/extraction.parser";
import { ExtractionStatus, LeadSource, VolumeUnit, Industry, PainPoints } from "@vambe/shared";
import { LlmExtractionResult } from "./llm";

describe("ExtractService", () => {
  let extractService: ExtractService;
  let prismaService: any;
  let deepSeekClient: any;
  let extractionParser: any;

  const mockMeeting = {
    id: "meeting-1",
    transcript: "Gracias por la reunion. En nuestra empresa, que se enfoca en servicios financieros, hemos notado que la carga de trabajo en el area de atencion al cliente ha incrementado significativamente desde que expandimos nuestras operaciones internacionales. No fue hasta que un colega menciono Vambe en una conferencia de tecnologia que consideramos automatizar parte del proceso. Nuestro equipo actual se enfrenta a cerca de 500 interacciones semanales, principalmente consultas repetitivas que creemos podrían ser automáticas.",
    customer: { id: "customer-1", email: "test@example.com" },
  };

  const mockExtraction = {
    id: "extraction-1",
    meetingId: "meeting-1",
    model: "deepseek-chat",
    status: ExtractionStatus.SUCCESS,
    createdAt: new Date(),
  };

  const mockLlmResult: LlmExtractionResult = {
    extraction: {
      industry: Industry.SERVICIOS_FINANCIEROS,
      businessModel: null,
      jtbdPrimary: [],
      painPoints: [PainPoints.SOBRECARGA_EQUIPO, PainPoints.CONSULTAS_REPETITIVAS],
      leadSource: null,
      processMaturity: null,
      toolingMaturity: null,
      knowledgeComplexity: null,
      riskLevel: null,
      integrations: [],
      urgency: null,
      successMetrics: [],
      objections: [],
      sentiment: null,
      volume: null,
    },
    rawResponse: JSON.stringify({ content: "{}" }),
    metadata: { provider: "deepseek", model: "deepseek-chat", durationMs: 1500, promptTokens: 100, completionTokens: 200, totalTokens: 300 },
  };

  beforeEach(() => {
    prismaService = {
      meeting: { findUnique: vi.fn() },
      extraction: { upsert: vi.fn() },
      llmApiLog: { create: vi.fn(), findFirst: vi.fn() },
    };

    deepSeekClient = { extractFromTranscript: vi.fn() };
    extractionParser = { parseAndSave: vi.fn() };

    extractService = new ExtractService(prismaService, deepSeekClient, extractionParser);
  });

  describe("extractFromMeeting", () => {
    it("should throw error when meeting does not exist", async () => {
      prismaService.meeting.findUnique.mockResolvedValue(null);

      await expect(extractService.extractFromMeeting("non-existent")).rejects.toThrow("Meeting non-existent not found");
    });

    it("should successfully extract using DeepSeek", async () => {
      prismaService.meeting.findUnique.mockResolvedValue(mockMeeting);
      deepSeekClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      const result = await extractService.extractFromMeeting("meeting-1");

      expect(result.status).toBe(ExtractionStatus.SUCCESS);
      expect(result.meetingId).toBe("meeting-1");
      expect(extractionParser.parseAndSave).toHaveBeenCalled();
    });

    it("should handle extraction failure", async () => {
      const error = Object.assign(new Error("DeepSeek API error"), {
        rawResponse: JSON.stringify({ error: "DeepSeek API error" }),
        metadata: { provider: "deepseek", model: "deepseek-chat", durationMs: 500 },
      });

      prismaService.meeting.findUnique.mockResolvedValue(mockMeeting);
      deepSeekClient.extractFromTranscript.mockRejectedValue(error);
      prismaService.extraction.upsert.mockResolvedValue({ ...mockExtraction, status: ExtractionStatus.FAILED });
      prismaService.llmApiLog.create.mockResolvedValue({});

      const result = await extractService.extractFromMeeting("meeting-1");

      expect(result.status).toBe(ExtractionStatus.FAILED);
      expect(result.extraction).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("should merge deterministic results with LLM results", async () => {
      const transcript = "Manejamos cerca de 500 interacciones semanales. En una conferencia de tecnologia conocimos Vambe.";

      prismaService.meeting.findUnique.mockResolvedValue({ ...mockMeeting, transcript });
      deepSeekClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          leadSource: LeadSource.CONFERENCIA,
          volume: expect.objectContaining({ quantity: 500, unit: VolumeUnit.SEMANAL }),
        })
      );
    });

    it("should prioritize deterministic leadSource over LLM", async () => {
      const llmWithLeadSource = { ...mockLlmResult, extraction: { ...mockLlmResult.extraction, leadSource: LeadSource.GOOGLE } };

      prismaService.meeting.findUnique.mockResolvedValue({ ...mockMeeting, transcript: "En una conferencia conocimos Vambe." });
      deepSeekClient.extractFromTranscript.mockResolvedValue(llmWithLeadSource);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({ leadSource: LeadSource.CONFERENCIA })
      );
    });

    it("should detect volume from transcript", async () => {
      prismaService.meeting.findUnique.mockResolvedValue({ ...mockMeeting, transcript: "Actualmente manejamos alrededor de 200 mensajes diarios." });
      deepSeekClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({ volume: expect.objectContaining({ quantity: 200, unit: VolumeUnit.DIARIO }) })
      );
    });
  });
});
