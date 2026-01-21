import { CustomerWithRelations } from "../../../../common/types";
import { UNKNOWN_VALUE, TOP_PERFORMERS_LIMIT } from "../../../../common/constants";
import { calculateConversionRate } from "../../../../common/helpers/metrics.helper";

type CategoryStatsRaw = {
  total: number;
  closed: number;
};

export type CategoryBreakdown = {
  byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }>;
  byJTBD: Record<string, { total: number; closed: number; conversionRate: number }>;
  byIndustry: Record<string, { total: number; closed: number; conversionRate: number }>;
};

export function calculateBreakdown(
  customers: CustomerWithRelations[],
  getExtraction: (customer: CustomerWithRelations) => { leadSource?: string | null; jtbdPrimary?: string[]; industry?: string | null } | null
): CategoryBreakdown {
  const byLeadSource: Record<string, CategoryStatsRaw> = {};
  const byJTBD: Record<string, CategoryStatsRaw> = {};
  const byIndustry: Record<string, CategoryStatsRaw> = {};

  for (const customer of customers) {
    const extraction = getExtraction(customer);

    const leadSource = extraction?.leadSource || UNKNOWN_VALUE;
    incrementCategoryStats(byLeadSource, leadSource, customer.closed);

    if (extraction?.jtbdPrimary && extraction.jtbdPrimary.length > 0) {
      for (const jtbd of extraction.jtbdPrimary) {
        incrementCategoryStats(byJTBD, jtbd, customer.closed);
      }
    }

    if (extraction?.industry) {
      incrementCategoryStats(byIndustry, extraction.industry, customer.closed);
    }
  }

  return {
    byLeadSource: calculateConversionRates(byLeadSource),
    byJTBD: calculateConversionRates(byJTBD),
    byIndustry: calculateConversionRates(byIndustry),
  };
}

export function extractTopPerformers(
  byLeadSource: Record<string, { conversionRate: number }>,
  limit: number = TOP_PERFORMERS_LIMIT
): string[] {
  return Object.entries(byLeadSource)
    .map(([source, stats]) => ({ source, conversionRate: stats.conversionRate }))
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, limit)
    .map((item) => item.source);
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

