import { CustomerWithRelations } from "../../../../common/types";

type CategoryStatsRaw = {
  total: number;
  closed: number;
};

export function calculateTimeSeries(customers: CustomerWithRelations[]): {
  conversionTrend: Array<{ period: string; conversionRate: number }>;
} {
  const timeSeriesMap = new Map<string, CategoryStatsRaw>();

  for (const customer of customers) {
    const date = new Date(customer.meetingDate);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!timeSeriesMap.has(period)) {
      timeSeriesMap.set(period, { total: 0, closed: 0 });
    }

    const periodData = timeSeriesMap.get(period)!;
    periodData.total++;
    if (customer.closed) {
      periodData.closed++;
    }
  }

  const conversionTrend = Array.from(timeSeriesMap.entries())
    .map(([period, data]) => ({
      period,
      conversionRate: roundToOneDecimal(calculateConversionRate(data.total, data.closed)),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return { conversionTrend };
}

function calculateConversionRate(total: number, closed: number): number {
  return total > 0 ? (closed / total) * 100 : 0;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
