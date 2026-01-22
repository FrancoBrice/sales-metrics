import { InsightsData } from "../../insights-client.interface";
import { MAX_SIGNIFICANT_FINDINGS } from "../prompt.config";
import { STATISTICAL_LABELS } from "../section.labels";
import { joinNonEmpty } from "../section.utils";

type StatisticalAnalysis = NonNullable<InsightsData["statisticalAnalysis"]>;
type OverallMetrics = InsightsData["overallMetrics"];

export function buildStatisticalSection(
  analysis: StatisticalAnalysis,
  overall?: OverallMetrics
): string {
  const overallRate = overall?.conversionRate || 0;
  const sections: string[] = [];

  if (overallRate > 0) {
    sections.push(`${STATISTICAL_LABELS.avgConversion}: ${overallRate.toFixed(1)}%`);
  }

  if (analysis.topPerformers.length > 0) {
    const performers = analysis.topPerformers
      .map((p) => {
        const diff = (p.conversionRate - overallRate).toFixed(1);
        return `  ${p.category}: ${p.conversionRate.toFixed(1)}% (${p.closed}/${p.total}), +${diff}% vs avg`;
      })
      .join("\n");
    sections.push(`${STATISTICAL_LABELS.topPerformers}:\n${performers}`);
  }

  if (analysis.underperformers.length > 0) {
    const underperformers = analysis.underperformers
      .map((u) => {
        const diff = (u.conversionRate - overallRate).toFixed(1);
        return `  ${u.category}: ${u.conversionRate.toFixed(1)}% (${u.closed}/${u.total}), ${diff}% vs avg`;
      })
      .join("\n");
    sections.push(`${STATISTICAL_LABELS.underperformers}:\n${underperformers}`);
  }

  if (analysis.highVolumeOpportunities.length > 0) {
    const opportunities = analysis.highVolumeOpportunities
      .map(
        (o) =>
          `  ${o.category}: Volume ${o.volume}, ${o.conversionRate.toFixed(1)}% (${o.total} leads)`
      )
      .join("\n");
    sections.push(`${STATISTICAL_LABELS.highVolumeOpportunities}:\n${opportunities}`);
  }

  if (analysis.significantFindings.length > 0) {
    const findings = analysis.significantFindings
      .slice(0, MAX_SIGNIFICANT_FINDINGS)
      .map((s) => {
        return `  ${s.category} (${s.dimension}): ${s.significance} significance - ${s.reasoning}`;
      })
      .join("\n");
    sections.push(`${STATISTICAL_LABELS.significantFindings}:\n${findings}`);
  }

  return joinNonEmpty(sections);
}
