import { InsightsData } from "../../insights-client.interface";
import { BREAKDOWN_LABELS } from "../section.labels";
import { getTopPerformers, joinNonEmpty, createSection } from "../section.utils";

type BreakdownData = InsightsData["breakdown"];

export function buildBreakdownSection(breakdown: BreakdownData): string {
  const sections: string[] = [];

  const leadSources = getTopPerformers(breakdown.byLeadSource);
  if (leadSources.length > 0) {
    sections.push(createSection(BREAKDOWN_LABELS.leadSources, leadSources));
  }

  const jtbd = getTopPerformers(breakdown.byJTBD);
  if (jtbd.length > 0) {
    sections.push(createSection(BREAKDOWN_LABELS.jtbd, jtbd));
  }

  const industries = getTopPerformers(breakdown.byIndustry);
  if (industries.length > 0) {
    sections.push(createSection(BREAKDOWN_LABELS.industries, industries));
  }

  return joinNonEmpty(sections);
}
