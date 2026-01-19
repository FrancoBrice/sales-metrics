import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Extraction } from "@vambe/shared";
import { LlmClient, DeterministicHints, LlmExtractionResult } from "./llmClient.interface";
import { ValidationService } from "../services/validation.service";
import { buildExtractionPrompt } from "../prompt/promptBuilder";
import { tryParseJson } from "../utils/jsonRepair";

@Injectable()
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = "gemini-flash-latest";

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: ValidationService
  ) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is required. Please configure your Gemini API key in the environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<LlmExtractionResult> {
    const startTime = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const prompt = buildExtractionPrompt(transcript, hints);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const durationMs = Date.now() - startTime;

      const rawResponse = JSON.stringify({
        text,
        model: this.modelName,
        timestamp: new Date().toISOString(),
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No valid JSON found in Gemini API response. Raw response: ${text}`);
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        throw new Error(`Failed to parse JSON from Gemini API response. Raw JSON: ${jsonMatch[0]}`);
      }

      const extraction = this.validationService.validateAndMerge(parsed, transcript);

      return {
        extraction,
        rawResponse,
        metadata: {
          provider: "gemini",
          model: this.modelName,
          durationMs,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`LLM extraction failed: ${error}`);
      const errorResponse = JSON.stringify({
        error: String(error),
        model: this.modelName,
        timestamp: new Date().toISOString(),
      });
      const errorWithMetadata = Object.assign(new Error(`Gemini API extraction failed: ${error}`), {
        rawResponse: errorResponse,
        metadata: {
          provider: "gemini",
          model: this.modelName,
          durationMs,
        },
      });
      throw errorWithMetadata;
    }
  }
}
