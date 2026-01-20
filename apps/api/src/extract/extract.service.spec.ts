import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExtractService } from "./extract.service";
import { PrismaService } from "../prisma/prisma.service";
import { GeminiClient } from "./llm/clients/geminiClient";
import { ExtractionParser } from "./llm/services/extraction.parser";
import { ExtractionStatus, LeadSource, VolumeUnit, Industry, PainPoints } from "@vambe/shared";
import { LlmExtractionResult } from "./llm";

describe("ExtractService", () => {
  let extractService: ExtractService;
  let prismaService: any;
  let geminiClient: any;
  let extractionParser: any;

  const mockMeeting = {
    id: "meeting-1",
    transcript: "Gracias por la reunion. En nuestra empresa, que se enfoca en servicios financieros, hemos notado que la carga de trabajo en el area de atencion al cliente ha incrementado significativamente desde que expandimos nuestras operaciones internacionales. No fue hasta que un colega menciono Vambe en una conferencia de tecnologia que consideramos automatizar parte del proceso. Nuestro equipo actual se enfrenta a cerca de 500 interacciones semanales, principalmente consultas repetitivas que creemos podrían ser automáticas.",
    customer: {
      id: "customer-1",
      email: "test@example.com",
    },
  };

  const mockExtraction = {
    id: "extraction-1",
    meetingId: "meeting-1",
    model: "gemini-flash-latest",
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
    metadata: {
      provider: "gemini",
      model: "gemini-flash-latest",
      durationMs: 1500,
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
    },
  };

  beforeEach(() => {
    prismaService = {
      meeting: {
        findUnique: vi.fn(),
      },
      extraction: {
        upsert: vi.fn(),
      },
      llmApiLog: {
        create: vi.fn(),
      },
    };

    geminiClient = {
      extractFromTranscript: vi.fn(),
    };


    extractionParser = {
      parseAndSave: vi.fn(),
    };

    extractService = new ExtractService(
      prismaService,
      geminiClient,
      extractionParser
    );
  });

  describe("extractFromMeeting", () => {
    it("should return null when meeting does not exist", async () => {
      prismaService.meeting.findUnique.mockResolvedValue(null);

      const result = await extractService.extractFromMeeting("non-existent");

      expect(result).toBeNull();
      expect(prismaService.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent" },
        include: { customer: true },
      });
    });

    it("should successfully extract using Gemini on first attempt", async () => {
      prismaService.meeting.findUnique.mockResolvedValue(mockMeeting);
      geminiClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      const result = await extractService.extractFromMeeting("meeting-1");

      expect(result).toBeDefined();
      expect(result?.status).toBe(ExtractionStatus.SUCCESS);
      expect(result?.meetingId).toBe("meeting-1");
      expect(geminiClient.extractFromTranscript).toHaveBeenCalledWith(
        mockMeeting.transcript,
        expect.objectContaining({
          leadSource: expect.anything(),
          volume: expect.anything(),
          integrations: expect.any(Array),
        })
      );
      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          industry: Industry.SERVICIOS_FINANCIEROS,
        })
      );
    });

    it("should fail when Gemini fails", async () => {
      const geminiError = Object.assign(
        new Error("Gemini API error"),
        {
          rawResponse: JSON.stringify({ error: "Gemini API error" }),
          metadata: {
            provider: "gemini",
            model: "gemini-flash-latest",
            durationMs: 500,
          },
        }
      );

      prismaService.meeting.findUnique.mockResolvedValue(mockMeeting);
      geminiClient.extractFromTranscript.mockRejectedValue(geminiError);
      prismaService.extraction.upsert.mockResolvedValue({
        ...mockExtraction,
        status: ExtractionStatus.FAILED,
      });
      prismaService.llmApiLog.create.mockResolvedValue({});

      const result = await extractService.extractFromMeeting("meeting-1");

      expect(result).toBeDefined();
      expect(result?.status).toBe(ExtractionStatus.FAILED);
      expect(result?.extraction).toBeNull();
      expect(result?.error).toBeDefined();
      expect(geminiClient.extractFromTranscript).toHaveBeenCalled();
      expect(prismaService.llmApiLog.create).toHaveBeenCalledTimes(1);
      expect(extractionParser.parseAndSave).not.toHaveBeenCalled();
    });


    it("should merge deterministic extraction results with LLM results", async () => {
      const transcriptWithVolume = "Manejamos cerca de 500 interacciones semanales. En una conferencia de tecnologia conocimos Vambe.";

      prismaService.meeting.findUnique.mockResolvedValue({
        ...mockMeeting,
        transcript: transcriptWithVolume,
      });

      geminiClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      const result = await extractService.extractFromMeeting("meeting-1");

      expect(result).toBeDefined();
      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          leadSource: LeadSource.CONFERENCIA,
          volume: expect.objectContaining({
            quantity: 500,
            unit: VolumeUnit.SEMANAL,
          }),
        })
      );
    });

    it("should follow the correct extraction flow: regex -> LLM -> parse", async () => {
      const callOrder: string[] = [];

      prismaService.meeting.findUnique.mockImplementation(async () => {
        callOrder.push("1. findUnique meeting");
        return mockMeeting;
      });

      geminiClient.extractFromTranscript.mockImplementation(async () => {
        callOrder.push("2. gemini extractFromTranscript");
        return mockLlmResult;
      });

      prismaService.extraction.upsert.mockImplementation(async () => {
        callOrder.push("3. extraction upsert");
        return mockExtraction;
      });

      prismaService.llmApiLog.create.mockImplementation(async () => {
        callOrder.push("4. llmApiLog create");
        return {};
      });

      extractionParser.parseAndSave.mockImplementation(async () => {
        callOrder.push("5. parseAndSave");
        return undefined;
      });

      await extractService.extractFromMeeting("meeting-1");

      expect(callOrder).toEqual([
        "1. findUnique meeting",
        "2. gemini extractFromTranscript",
        "3. extraction upsert",
        "4. llmApiLog create",
        "5. parseAndSave",
      ]);
    });


    it("should handle conference lead source from transcript", async () => {
      const conferenceTranscript = "No fue hasta que un colega menciono Vambe en una conferencia de tecnologia que consideramos automatizar.";

      prismaService.meeting.findUnique.mockResolvedValue({
        ...mockMeeting,
        transcript: conferenceTranscript,
      });

      geminiClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          leadSource: LeadSource.CONFERENCIA,
        })
      );
    });

    it("should handle volume detection from transcript", async () => {
      const volumeTranscript = "Actualmente manejamos alrededor de 200 mensajes diarios y necesitamos una solucion automatizada.";

      prismaService.meeting.findUnique.mockResolvedValue({
        ...mockMeeting,
        transcript: volumeTranscript,
      });

      geminiClient.extractFromTranscript.mockResolvedValue(mockLlmResult);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          volume: expect.objectContaining({
            quantity: 200,
            unit: VolumeUnit.DIARIO,
          }),
        })
      );
    });

    it("should prioritize deterministic leadSource over LLM when both exist", async () => {
      const llmResultWithLeadSource: LlmExtractionResult = {
        ...mockLlmResult,
        extraction: {
          ...mockLlmResult.extraction,
          leadSource: LeadSource.GOOGLE,
        },
      };

      const transcriptWithConference = "En una conferencia conocimos Vambe.";

      prismaService.meeting.findUnique.mockResolvedValue({
        ...mockMeeting,
        transcript: transcriptWithConference,
      });

      geminiClient.extractFromTranscript.mockResolvedValue(llmResultWithLeadSource);
      prismaService.extraction.upsert.mockResolvedValue(mockExtraction);
      prismaService.llmApiLog.create.mockResolvedValue({});
      extractionParser.parseAndSave.mockResolvedValue(undefined);

      await extractService.extractFromMeeting("meeting-1");

      expect(extractionParser.parseAndSave).toHaveBeenCalledWith(
        "extraction-1",
        expect.objectContaining({
          leadSource: LeadSource.CONFERENCIA,
        })
      );
    });
  });
});
