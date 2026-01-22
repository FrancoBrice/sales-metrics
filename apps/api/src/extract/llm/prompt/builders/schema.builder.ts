import { EXTRACTION_ENUMS, getEnumValues } from "../extraction.enums";

const e = EXTRACTION_ENUMS;

export function buildSchemaSection(): string {
  return `{
  "industry": "Industry enum value or null. Valid values: ${getEnumValues(e.industry)}",
  "businessModel": "BusinessModel enum value or null. Valid values: ${getEnumValues(e.businessModel)}",
  "jtbdPrimary": ["array of JtbdPrimary enum values. Valid values: ${getEnumValues(e.jtbdPrimary)}"],
  "painPoints": ["array of PainPoints enum values. Valid values: ${getEnumValues(e.painPoints)}"],
  "leadSource": "LeadSource enum value or null. Valid values: ${getEnumValues(e.leadSource)}",
  "processMaturity": "ProcessMaturity enum value or null. Valid values: ${getEnumValues(e.processMaturity)}",
  "toolingMaturity": "ToolingMaturity enum value or null. Valid values: ${getEnumValues(e.toolingMaturity)}",
  "knowledgeComplexity": "KnowledgeComplexity enum value or null. Valid values: ${getEnumValues(e.knowledgeComplexity)}",
  "riskLevel": "RiskLevel enum value or null. Valid values: ${getEnumValues(e.riskLevel)}",
  "integrations": ["array of Integrations enum values. Valid values: ${getEnumValues(e.integrations)}"],
  "urgency": "Urgency enum value or null. Valid values: ${getEnumValues(e.urgency)}",
  "successMetrics": ["array of SuccessMetric enum values. Valid values: ${getEnumValues(e.successMetrics)}"],
  "objections": ["array of Objections enum values. Valid values: ${getEnumValues(e.objections)}"],
  "sentiment": "Sentiment enum value or null. Valid values: ${getEnumValues(e.sentiment)}",
  "volume": {
    "quantity": number or null,
    "unit": "VolumeUnit enum value or null. Valid values: ${getEnumValues(e.volumeUnit)}",
    "isPeak": boolean
  } or null
}`;
}
