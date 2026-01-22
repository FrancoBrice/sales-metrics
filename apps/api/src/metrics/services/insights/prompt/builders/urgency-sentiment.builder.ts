import { InsightsData } from "../../insights-client.interface";
import { TOP_PERFORMERS_LIMIT } from "../prompt.config";
import { URGENCY_SENTIMENT_LABELS } from "../section.labels";
import { getBreakdownWithDetails, joinNonEmpty, createSection } from "../section.utils";

type UrgencySentimentData = NonNullable<InsightsData["urgencySentiment"]>;

export function buildUrgencySentimentSection(
  urgencySentiment: UrgencySentimentData
): string {
  const sections: string[] = [];

  if (Object.keys(urgencySentiment.byUrgency).length > 0) {
    const urgencyLines = getBreakdownWithDetails(urgencySentiment.byUrgency);
    sections.push(createSection(URGENCY_SENTIMENT_LABELS.byUrgency, urgencyLines));
  }

  if (Object.keys(urgencySentiment.bySentiment).length > 0) {
    const sentimentLines = getBreakdownWithDetails(urgencySentiment.bySentiment);
    sections.push(createSection(URGENCY_SENTIMENT_LABELS.bySentiment, sentimentLines));
  }

  if (urgencySentiment.matrix.length > 0) {
    const topCombinations = urgencySentiment.matrix
      .filter((m) => m.total > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, TOP_PERFORMERS_LIMIT)
      .map(
        (m) =>
          `  ${m.urgency}/${m.sentiment}: ${m.conversionRate.toFixed(1)}% (${m.closed}/${m.total})`
      );

    if (topCombinations.length > 0) {
      sections.push(
        createSection(URGENCY_SENTIMENT_LABELS.topCombinations, topCombinations)
      );
    }
  }

  return joinNonEmpty(sections);
}
