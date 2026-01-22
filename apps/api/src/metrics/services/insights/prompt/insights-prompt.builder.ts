import { InsightsData } from "../insights-client.interface";
import {
  PROMPT_SYSTEM_ROLE,
  PROMPT_INSTRUCTIONS,
  PROMPT_OUTPUT_FORMAT,
  PROMPT_RULES,
} from "./prompt.templates";
import {
  buildStagesSection,
  buildBreakdownSection,
  buildTrendsSection,
  buildStatisticalSection,
  buildUrgencySentimentSection,
  buildFiltersSection,
} from "./builders";

export function buildInsightsPrompt(data: InsightsData): string {
  const stagesSection = buildStagesSection(data.stages);
  const breakdownSection = buildBreakdownSection(data.breakdown);
  const trendsSection = data.trends
    ? buildTrendsSection(data.trends.conversionTrend)
    : "";
  const statisticalSection = data.statisticalAnalysis
    ? buildStatisticalSection(data.statisticalAnalysis, data.overallMetrics)
    : "";
  const urgencySentimentSection = data.urgencySentiment
    ? buildUrgencySentimentSection(data.urgencySentiment)
    : "";
  const filtersSection = data.filters ? buildFiltersSection(data.filters) : "";

  const dataSections = [
    stagesSection,
    breakdownSection,
    urgencySentimentSection,
    trendsSection,
    statisticalSection,
  ].filter((s) => s.length > 0);

  const promptParts = [
    PROMPT_SYSTEM_ROLE,
    filtersSection,
    "Conversion and closure data:",
    dataSections.join("\n\n"),
    PROMPT_INSTRUCTIONS,
    PROMPT_OUTPUT_FORMAT,
    PROMPT_RULES,
  ].filter((s) => s.length > 0);

  return promptParts.join("\n\n");
}
