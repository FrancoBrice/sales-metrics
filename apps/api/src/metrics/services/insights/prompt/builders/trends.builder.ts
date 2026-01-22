import { MAX_TREND_PERIODS } from "../prompt.config";
import { TRENDS_LABELS } from "../section.labels";

type TrendsData = Array<{ period: string; conversionRate: number }>;

export function buildTrendsSection(trends: TrendsData): string {
  if (trends.length === 0) return "";

  const trendLines = trends
    .slice(-MAX_TREND_PERIODS)
    .map((t) => `  ${t.period}: ${t.conversionRate.toFixed(1)}%`)
    .join("\n");

  const isImproving =
    trends.length >= 2 &&
    trends[trends.length - 1].conversionRate > trends[trends.length - 2].conversionRate;

  const trendDirection = isImproving
    ? TRENDS_LABELS.improving
    : TRENDS_LABELS.declining;

  return `${TRENDS_LABELS.title}:\n${trendLines}\nTrend: ${trendDirection}`;
}
