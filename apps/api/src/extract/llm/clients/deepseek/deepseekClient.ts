import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { LlmClient, DeterministicHints, LlmExtractionResult } from "../llmClient.interface";
import { buildExtractionPrompt } from "../../prompt/promptBuilder";
import { DeepSeekResponseParser, ApiCompletionResponse } from "./deepseek-response.parser";
import { RetryHandler } from "./retry.handler";
import { DeepSeekApiException, DeepSeekQuotaException, isQuotaError } from "./deepseek.exceptions";
import { LLM_TIMEOUT_MS, LLM_MAX_TOKENS, LLM_TEMPERATURE_LOW } from "../../../../common/constants";

@Injectable()
export class DeepSeekClient implements LlmClient {
  private readonly logger = new Logger(DeepSeekClient.name);
  private readonly apiClient: OpenAI;
  private readonly modelName = "deepseek-chat";

  constructor(
    private readonly configService: ConfigService,
    private readonly responseParser: DeepSeekResponseParser,
    private readonly retryHandler: RetryHandler
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
    return this.retryHandler.executeWithRetry(async () => {
      const startTime = Date.now();

      try {
        const prompt = buildExtractionPrompt(transcript, hints);
        const apiResponse = await this.createCompletion(prompt);
        const durationMs = Date.now() - startTime;

        return this.responseParser.parse(
          apiResponse,
          transcript,
          this.modelName,
          durationMs
        );
      } catch (error) {
        const durationMs = Date.now() - startTime;
        return this.handleError(error, durationMs);
      }
    });
  }

  private async createCompletion(prompt: string): Promise<ApiCompletionResponse> {
    const completionPromise = this.apiClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.modelName,
      temperature: LLM_TEMPERATURE_LOW,
      max_tokens: LLM_MAX_TOKENS,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${LLM_TIMEOUT_MS / 1000} seconds`)), LLM_TIMEOUT_MS)
    );

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    const content = completion.choices[0]?.message?.content || "";

    return {
      content,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : null,
    };
  }

  private handleError(error: unknown, durationMs: number): never {
    this.logger.error(`DeepSeek extraction failed: ${error}`);

    if (error instanceof DeepSeekApiException) {
      if (isQuotaError(error)) {
        this.logger.error(`DeepSeek quota exhausted or rate limited. Please check your billing and quota limits.`);
        throw new DeepSeekQuotaException(
          `DeepSeek API extraction failed: ${error.message}`,
          error.rawResponse,
          error.metadata
        );
      }
      throw error;
    }

    const errorResponse = JSON.stringify({
      error: String(error),
      model: this.modelName,
      timestamp: new Date().toISOString(),
      quotaError: isQuotaError(error),
    });

    throw new DeepSeekApiException(
      `DeepSeek API extraction failed: ${error}`,
      errorResponse,
      {
        provider: "deepseek",
        model: this.modelName,
        durationMs,
      }
    );
  }
}
