import { TOP_PERFORMERS_LIMIT } from "./prompt.config";

export interface BreakdownStats {
  total: number;
  closed: number;
  conversionRate: number;
}

export function getTopPerformers(
  breakdown: Record<string, BreakdownStats>,
  limit: number = TOP_PERFORMERS_LIMIT
): string[] {
  return Object.entries(breakdown)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, limit)
    .map(
      ([name, stats]) =>
        `  ${name}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}%`
    );
}

export function getBreakdownWithDetails(
  breakdown: Record<string, BreakdownStats>,
  limit: number = TOP_PERFORMERS_LIMIT
): string[] {
  return Object.entries(breakdown)
    .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
    .slice(0, limit)
    .map(
      ([name, stats]) =>
        `  ${name}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% (${stats.closed}/${stats.total})`
    );
}

export function joinNonEmpty(sections: string[]): string {
  return sections.filter((s) => s.length > 0).join("\n\n");
}

export function createSection(label: string, lines: string[]): string {
  if (lines.length === 0) return "";
  return `${label}:\n${lines.join("\n")}`;
}
