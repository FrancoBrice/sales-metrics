import { CustomerWithRelations } from "../../../../common/types";
import { calculateConversionRate, roundToOneDecimal } from "../../../../common/helpers/metrics.helper";

type CategoryStatsRaw = {
  total: number;
  closed: number;
};

export function calculateUrgencySentimentMetrics(
  customers: CustomerWithRelations[],
  getExtraction: (customer: CustomerWithRelations) => { urgency?: string | null; sentiment?: string | null } | null
): {
  byUrgency: Record<string, { total: number; closed: number; conversionRate: number }>;
  bySentiment: Record<string, { total: number; closed: number; conversionRate: number }>;
  matrix: Array<{ urgency: string; sentiment: string; total: number; closed: number; conversionRate: number }>;
} {
  const urgencyStats: Record<string, CategoryStatsRaw> = {};
  const sentimentStats: Record<string, CategoryStatsRaw> = {};
  const urgencySentimentMatrix: Record<string, Record<string, CategoryStatsRaw>> = {};

  for (const customer of customers) {
    const extraction = getExtraction(customer);
    if (!extraction) continue;

    const urgency = extraction.urgency || "MEDIA";
    const sentiment = extraction.sentiment || "NEUTRAL";

    incrementCategoryStats(urgencyStats, urgency, customer.closed);
    incrementCategoryStats(sentimentStats, sentiment, customer.closed);
    incrementMatrixStats(urgencySentimentMatrix, urgency, sentiment, customer.closed);
  }

  const byUrgency = calculateConversionRates(urgencyStats);
  const bySentiment = calculateConversionRates(sentimentStats);
  const matrix = buildUrgencySentimentMatrix(urgencySentimentMatrix);

  return { byUrgency, bySentiment, matrix };
}

function incrementCategoryStats(
  category: Record<string, CategoryStatsRaw>,
  key: string,
  isClosed: boolean
): void {
  if (!category[key]) {
    category[key] = { total: 0, closed: 0 };
  }
  category[key].total++;
  if (isClosed) {
    category[key].closed++;
  }
}

function incrementMatrixStats(
  matrix: Record<string, Record<string, CategoryStatsRaw>>,
  urgency: string,
  sentiment: string,
  isClosed: boolean
): void {
  if (!matrix[urgency]) {
    matrix[urgency] = {};
  }
  if (!matrix[urgency][sentiment]) {
    matrix[urgency][sentiment] = { total: 0, closed: 0 };
  }
  matrix[urgency][sentiment].total++;
  if (isClosed) {
    matrix[urgency][sentiment].closed++;
  }
}

function buildUrgencySentimentMatrix(
  matrix: Record<string, Record<string, CategoryStatsRaw>>
): Array<{ urgency: string; sentiment: string; total: number; closed: number; conversionRate: number }> {
  return Object.entries(matrix).flatMap(([urgency, sentiments]) =>
    Object.entries(sentiments).map(([sentiment, stats]) => ({
      urgency,
      sentiment,
      total: stats.total,
      closed: stats.closed,
      conversionRate: roundToOneDecimal(calculateConversionRate(stats.total, stats.closed)),
    }))
  );
}

function calculateConversionRates(
  category: Record<string, CategoryStatsRaw>
): Record<string, { total: number; closed: number; conversionRate: number }> {
  const result: Record<string, { total: number; closed: number; conversionRate: number }> = {};
  for (const key in category) {
    result[key] = {
      ...category[key],
      conversionRate: calculateConversionRate(category[key].total, category[key].closed),
    };
  }
  return result;
}
