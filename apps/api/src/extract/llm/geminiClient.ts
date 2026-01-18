import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Extraction } from "@vambe/shared";
import { LlmClient } from "./llmClient.interface";
import { ValidationService } from "./validation.service";
import { EXTRACTION_PROMPT } from "./constants";
import { tryParseJson } from "./jsonRepair";

@Injectable()
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = "gemini-1.5-flash-latest";

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

  async extractFromTranscript(transcript: string): Promise<Extraction> {

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const prompt = EXTRACTION_PROMPT.replace("{transcript}", transcript);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in Gemini API response");
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        throw new Error("Failed to parse JSON from Gemini API response");
      }

      return this.validationService.validateAndMerge(parsed, transcript);
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error}`);
      throw new Error(`Gemini API extraction failed: ${error}`);
    }
  }




}
