import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { InsightsClient, InsightsData, InsightsResult } from "./insights-client.interface";
import { buildInsightsPrompt } from "./prompt/insights-prompt.builder";
import { tryParseJson } from "../../../extract/llm/utils";

type LLMApiClient = OpenAI;

@Injectable()
export class LlmInsightsClient implements InsightsClient {
  private readonly logger = new Logger(LlmInsightsClient.name);
  private readonly apiClient: LLMApiClient;
  private readonly modelName = "deepseek-chat";

  constructor(
    private readonly configService: ConfigService
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

  async generateInsights(data: InsightsData): Promise<InsightsResult> {
    return this.callWithRetry(async () => {
      const startTime = Date.now();

      const systemInstruction = "Eres un analista de ventas experto. Genera insights accionables basados en datos de tasas de conversión y cierres de ventas por categorías. Responde ÚNICAMENTE con JSON válido, sin markdown, sin code blocks, sin explicaciones adicionales.";
      const prompt = buildInsightsPrompt(data);

      try {
        const completionPromise = this.apiClient.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          model: this.modelName,
          temperature: 0.3,
          max_tokens: 4096,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout after 60 seconds")), 60000)
        );

        const completion = await Promise.race([completionPromise, timeoutPromise]);

        const text = completion.choices[0]?.message?.content || "";
        const durationMs = Date.now() - startTime;

        let jsonText = text.trim();

        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```$/m, "");
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/m, "");
        }

        let jsonMatch = jsonText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          const firstBrace = jsonText.indexOf("{");
          if (firstBrace !== -1) {
            jsonText = jsonText.substring(firstBrace);
            const lastBrace = jsonText.lastIndexOf("}");
            if (lastBrace !== -1) {
              jsonText = jsonText.substring(0, lastBrace + 1);
              jsonMatch = [jsonText];
            }
          }
        }

        if (!jsonMatch) {
          this.logger.error(`No valid JSON found. Raw response length: ${text.length}, first 500 chars: ${text.substring(0, 500)}`);
          throw new Error(`No valid JSON found in DeepSeek API response. Raw response length: ${text.length}`);
        }

        let parsed = tryParseJson<{
          bottlenecks?: string[];
          opportunities?: string[];
          recommendations?: string[];
        }>(jsonMatch[0]);

        if (!parsed) {
          const repaired = jsonText.replace(/,\s*([}\]])/g, "$1");
          parsed = tryParseJson<{
            bottlenecks?: string[];
            opportunities?: string[];
            recommendations?: string[];
          }>(repaired);
        }

        if (!parsed || !this.isValidInsights(parsed)) {
          throw new Error("Invalid insights format from LLM");
        }

        return {
          bottlenecks: parsed.bottlenecks || [],
          opportunities: parsed.opportunities || [],
          recommendations: parsed.recommendations || [],
          metadata: {
            provider: "deepseek",
            model: this.modelName,
            durationMs,
          },
        };
      } catch (error) {
        const durationMs = Date.now() - startTime;
        this.logger.error(`LLM insights generation failed: ${error}`);

        throw new Error(`Failed to generate LLM insights: ${error}`);
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

  private isValidInsights(data: unknown): data is {
    bottlenecks?: string[];
    opportunities?: string[];
    recommendations?: string[];
  } {
    if (typeof data !== "object" || data === null) {
      return false;
    }
    const obj = data as Record<string, unknown>;
    return (
      (Array.isArray(obj.bottlenecks) || obj.bottlenecks === undefined) &&
      (Array.isArray(obj.opportunities) || obj.opportunities === undefined) &&
      (Array.isArray(obj.recommendations) || obj.recommendations === undefined)
    );
  }
}
