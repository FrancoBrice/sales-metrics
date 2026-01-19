import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Extraction } from "@vambe/shared";
import { LlmClient, DeterministicHints, LlmExtractionResult } from "./llmClient.interface";
import { ValidationService } from "../services/validation.service";
import { buildExtractionPrompt } from "../prompt/promptBuilder";
import { tryParseJson } from "../utils/jsonRepair";

@Injectable()
export class OpenAiClient implements LlmClient {
  private readonly logger = new Logger(OpenAiClient.name);
  private readonly openai: OpenAI;
  private readonly modelName = "gpt-4.1-nano";

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: ValidationService
  ) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required. Please configure it in the environment variables.");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<LlmExtractionResult> {
    const startTime = Date.now();
    try {
      const prompt = buildExtractionPrompt(transcript, hints);

      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.modelName,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content || "";
      const durationMs = Date.now() - startTime;

      const rawResponse = JSON.stringify({
        content,
        model: this.modelName,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : null,
        timestamp: new Date().toISOString(),
      });

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No valid JSON found in OpenAI API response. Raw response: ${content}`);
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        throw new Error(`Failed to parse JSON from OpenAI API response. Raw JSON: ${jsonMatch[0]}`);
      }

      const extraction = this.validationService.validateAndMerge(parsed, transcript);

      return {
        extraction,
        rawResponse,
        metadata: {
          provider: "openai",
          model: this.modelName,
          durationMs,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`OpenAI extraction failed: ${error}`);
      const errorResponse = JSON.stringify({
        error: String(error),
        model: this.modelName,
        timestamp: new Date().toISOString(),
      });
      const errorWithMetadata = Object.assign(new Error(`OpenAI API extraction failed: ${error}`), {
        rawResponse: errorResponse,
        metadata: {
          provider: "openai",
          model: this.modelName,
          durationMs,
        },
      });
      throw errorWithMetadata;
    }
  }
}
