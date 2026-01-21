import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Extraction } from "@vambe/shared";
import { LlmClient, DeterministicHints, LlmExtractionResult } from "./llmClient.interface";
import { ValidationService } from "../services/validation.service";
import { buildExtractionPrompt } from "../prompt/promptBuilder";
import { tryParseJson } from "../utils/jsonRepair";
import { LLM_TIMEOUT_MS } from "../../../common/constants";

@Injectable()
export class OpenAiClient implements LlmClient {
  private readonly logger = new Logger(OpenAiClient.name);
  private openai: OpenAI | null = null;
  private readonly modelName = "gpt-4o-mini";

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: ValidationService
  ) {}

  private getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = this.configService.get<string>("OPENAI_API_KEY");
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required. Please configure it in the environment variables.");
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  async extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<LlmExtractionResult> {
    const startTime = Date.now();
    try {
      const prompt = buildExtractionPrompt(transcript, hints);
      const client = this.getClient();

      const completionPromise = client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.modelName,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${LLM_TIMEOUT_MS / 1000} seconds`)), LLM_TIMEOUT_MS)
      );

      const completion = await Promise.race([completionPromise, timeoutPromise]);

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
        const errorWithMetadata = Object.assign(new Error(`No valid JSON found in OpenAI API response. Raw response: ${content}`), {
          rawResponse,
          metadata: {
            provider: "openai",
            model: this.modelName,
            durationMs,
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        });
        throw errorWithMetadata;
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        const errorWithMetadata = Object.assign(new Error(`Failed to parse JSON from OpenAI API response. Raw JSON: ${jsonMatch[0]}`), {
          rawResponse,
          metadata: {
            provider: "openai",
            model: this.modelName,
            durationMs,
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        });
        throw errorWithMetadata;
      }

      try {
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
      } catch (validationError) {
        const errorWithMetadata = Object.assign(new Error(`Validation failed: ${validationError}`), {
          rawResponse,
          metadata: {
            provider: "openai",
            model: this.modelName,
            durationMs,
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
            totalTokens: completion.usage?.total_tokens,
          },
        });
        throw errorWithMetadata;
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`OpenAI extraction failed: ${error}`);

      const errorObj = error as any;
      if (errorObj.rawResponse && errorObj.metadata) {
        throw error;
      }

      const isQuotaError = errorObj?.code === "insufficient_quota" ||
                          errorObj?.type === "insufficient_quota" ||
                          String(error).includes("insufficient_quota") ||
                          String(error).includes("quota");

      if (isQuotaError) {
        this.logger.error(`OpenAI quota exhausted. Please check your billing and quota limits.`);
      }

      const errorResponse = JSON.stringify({
        error: String(error),
        model: this.modelName,
        timestamp: new Date().toISOString(),
        quotaError: isQuotaError,
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
