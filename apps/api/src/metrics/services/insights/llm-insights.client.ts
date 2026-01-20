import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { InsightsClient, InsightsData, InsightsResult } from "./insights-client.interface";
import { buildInsightsPrompt } from "./prompt/insights-prompt.builder";
import { tryParseJson } from "../../../extract/llm/utils";

@Injectable()
export class LlmInsightsClient implements InsightsClient {
  private readonly logger = new Logger(LlmInsightsClient.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = "gemini-flash-latest";

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is required. Please configure your Gemini API key in the environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateInsights(data: InsightsData): Promise<InsightsResult> {
    const startTime = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 4096,
        },
      });

      const systemInstruction = "Eres un analista de ventas experto. Genera insights accionables basados en datos de embudos de ventas. Responde ÚNICAMENTE con JSON válido, sin markdown, sin code blocks, sin explicaciones adicionales.";
      const prompt = buildInsightsPrompt(data);
      const fullPrompt = `${systemInstruction}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
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
        throw new Error(`No valid JSON found in Gemini API response. Raw response length: ${text.length}`);
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
          provider: "gemini",
          model: this.modelName,
          durationMs,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`LLM insights generation failed: ${error}`);
      throw new Error(`Failed to generate LLM insights: ${error}`);
    }
  }

  private isValidInsights(data: any): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      (Array.isArray(data.bottlenecks) || data.bottlenecks === undefined) &&
      (Array.isArray(data.opportunities) || data.opportunities === undefined) &&
      (Array.isArray(data.recommendations) || data.recommendations === undefined)
    );
  }
}
