import { Injectable, Logger } from "@nestjs/common";
import { InsightsClient, InsightsData, InsightsResult } from "./insights-client.interface";
import { LlmInsightsClient } from "./llm-insights.client";
import { BasicInsightsClient } from "./basic-insights.client";
import { CACHE_TTL_MS } from "../../../common/constants";

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly cache = new Map<string, { result: InsightsResult; timestamp: number }>();

  constructor(
    private readonly llmClient: LlmInsightsClient,
    private readonly basicClient: BasicInsightsClient
  ) {}

  async generateInsights(
    data: InsightsData,
    useLlm: boolean = true
  ): Promise<InsightsResult> {
    const cacheKey = this.generateCacheKey(data);

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      this.logger.debug("Returning cached insights");
      return {
        ...cached.result,
        metadata: cached.result.metadata
          ? {
              ...cached.result.metadata,
              cached: true,
            }
          : undefined,
      };
    }

    try {
      let result: InsightsResult;

      if (useLlm) {
        try {
          result = await this.llmClient.generateInsights(data);
          this.logger.debug("Generated LLM insights successfully");
        } catch (error) {
          this.logger.warn(
            `LLM insights failed, falling back to basic: ${error}`
          );
          result = await this.basicClient.generateInsights(data);
        }
      } else {
        result = await this.basicClient.generateInsights(data);
      }

      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      this.logger.error(`Insights generation failed: ${error}`);
      return await this.basicClient.generateInsights(data);
    }
  }

  private generateCacheKey(data: InsightsData): string {
    const stagesKey = data.stages
      .map((s) => `${s.name}:${s.total}:${s.closed}`)
      .join("|");
    const breakdownKey = JSON.stringify(data.breakdown);
    return `${stagesKey}|${breakdownKey}`;
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.debug("Insights cache cleared");
  }
}
