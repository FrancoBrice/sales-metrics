import {
  Industry,
  BusinessModel,
  JtbdPrimary,
  PainPoints,
  LeadSource,
  ProcessMaturity,
  ToolingMaturity,
  KnowledgeComplexity,
  RiskLevel,
  Integrations,
  Urgency,
  SuccessMetric,
  Objections,
  Sentiment,
  VolumeUnit,
} from "@vambe/shared";

export const EXTRACTION_ENUMS = {
  industry: Industry,
  businessModel: BusinessModel,
  jtbdPrimary: JtbdPrimary,
  painPoints: PainPoints,
  leadSource: LeadSource,
  processMaturity: ProcessMaturity,
  toolingMaturity: ToolingMaturity,
  knowledgeComplexity: KnowledgeComplexity,
  riskLevel: RiskLevel,
  integrations: Integrations,
  urgency: Urgency,
  successMetrics: SuccessMetric,
  objections: Objections,
  sentiment: Sentiment,
  volumeUnit: VolumeUnit,
} as const;

export function getEnumValues(enumObject: Record<string, string>): string {
  return Object.values(enumObject).join(", ");
}
