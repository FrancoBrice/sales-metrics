import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Extraction } from "@vambe/shared";
import { LlmClient, DeterministicHints, LlmExtractionResult } from "./llmClient.interface";
import { ValidationService } from "../services/validation.service";
import { buildExtractionPrompt } from "../prompt/promptBuilder";
import { tryParseJson } from "../utils/jsonRepair";

type LLMApiClient = OpenAI;

@Injectable()
export class DeepSeekClient implements LlmClient {
  private readonly logger = new Logger(DeepSeekClient.name);
  private readonly apiClient: LLMApiClient;
  private readonly modelName = "deepseek-chat";

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: ValidationService
  ) {
    const apiKey = this.configService.get<string>("DEEPSEEK_API_KEY");
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is required. Please configure it in the environment variables.");
    }
    this.apiClient = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<LlmExtractionResult> {
    return this.callWithRetry(async () => {
      const startTime = Date.now();
      let rawResponse: string | undefined;

      const prompt = buildExtractionPrompt(transcript, hints);

      try {
        const completionPromise = this.apiClient.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: this.modelName,
          temperature: 0.2,
          max_tokens: 4096,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout after 60 seconds")), 60000)
        );

        const completion = await Promise.race([completionPromise, timeoutPromise]);

        const content = completion.choices[0]?.message?.content || "";
        const durationMs = Date.now() - startTime;

        rawResponse = JSON.stringify({
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
          const errorWithMetadata = Object.assign(new Error(`No valid JSON found in DeepSeek API response. Raw response: ${content}`), {
            rawResponse,
            metadata: {
              provider: "deepseek",
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
          const errorWithMetadata = Object.assign(new Error(`Failed to parse JSON from DeepSeek API response. Raw JSON: ${jsonMatch[0]}`), {
            rawResponse,
            metadata: {
              provider: "deepseek",
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
              provider: "deepseek",
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
              provider: "deepseek",
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
        this.logger.error(`DeepSeek extraction failed: ${error}`);

        const errorObj = error as any;
        if (errorObj.rawResponse && errorObj.metadata) {
          throw error;
        }

        const isQuotaError = errorObj?.code === "insufficient_quota" ||
                            errorObj?.type === "insufficient_quota" ||
                            String(error).includes("insufficient_quota") ||
                            String(error).includes("quota") ||
                            errorObj?.status === 429;

        if (isQuotaError) {
          this.logger.error(`DeepSeek quota exhausted or rate limited. Please check your billing and quota limits.`);
        }

        const errorResponse = rawResponse || JSON.stringify({
          error: String(error),
          model: this.modelName,
          timestamp: new Date().toISOString(),
          quotaError: isQuotaError,
        });
        const errorWithMetadata = Object.assign(new Error(`DeepSeek API extraction failed: ${error}`), {
          rawResponse: errorResponse,
          metadata: {
            provider: "deepseek",
            model: this.modelName,
            durationMs,
          },
        });
        throw errorWithMetadata;
      }
    });
  }

  private async callWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        const delayMs = 1000 * (attempt + 1);
        this.logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error("Max retries exceeded");
  }
}
