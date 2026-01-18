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
import { DeterministicHints } from "../clients/llmClient.interface";

const getEnumValues = (enumObject: Record<string, string>): string => {
  return Object.values(enumObject).join(", ");
};

function buildSchemaSection(): string {
  return `{
  "industry": "Industry enum value or null. Valid values: ${getEnumValues(Industry)}",
  "businessModel": "BusinessModel enum value or null. Valid values: ${getEnumValues(BusinessModel)}",
  "jtbdPrimary": ["array of JtbdPrimary enum values. Valid values: ${getEnumValues(JtbdPrimary)}"],
  "painPoints": ["array of PainPoints enum values. Valid values: ${getEnumValues(PainPoints)}"],
  "leadSource": "LeadSource enum value or null. Valid values: ${getEnumValues(LeadSource)}",
  "processMaturity": "ProcessMaturity enum value or null. Valid values: ${getEnumValues(ProcessMaturity)}",
  "toolingMaturity": "ToolingMaturity enum value or null. Valid values: ${getEnumValues(ToolingMaturity)}",
  "knowledgeComplexity": "KnowledgeComplexity enum value or null. Valid values: ${getEnumValues(KnowledgeComplexity)}",
  "riskLevel": "RiskLevel enum value or null. Valid values: ${getEnumValues(RiskLevel)}",
  "integrations": ["array of Integrations enum values. Valid values: ${getEnumValues(Integrations)}"],
  "urgency": "Urgency enum value or null. Valid values: ${getEnumValues(Urgency)}",
  "successMetrics": ["array of SuccessMetric enum values. Valid values: ${getEnumValues(SuccessMetric)}"],
  "objections": ["array of Objections enum values. Valid values: ${getEnumValues(Objections)}"],
  "sentiment": "Sentiment enum value or null. Valid values: ${getEnumValues(Sentiment)}",
  "volume": {
    "quantity": number or null,
    "unit": "VolumeUnit enum value or null. Valid values: ${getEnumValues(VolumeUnit)}",
    "isPeak": boolean
  } or null
}`;
}

function buildHintsSection(hints?: DeterministicHints): string {
  if (!hints) {
    return "";
  }

  const hintParts: string[] = [];
  if (hints.leadSource) {
    hintParts.push(`leadSource: "${hints.leadSource}"`);
  }
  if (hints.volume) {
    const vol = hints.volume;
    hintParts.push(
      `volume: { quantity: ${vol.quantity}, unit: "${vol.unit}", isPeak: ${vol.isPeak} }`
    );
  }
  if (hints.integrations && hints.integrations.length > 0) {
    hintParts.push(`integrations: [${hints.integrations.map((i) => `"${i}"`).join(", ")}]`);
  }

  if (hintParts.length === 0) {
    return "";
  }

  return `\n\nPre-extracted values (use these if they match the transcript, otherwise extract from transcript):\n${hintParts.join("\n")}\n`;
}

export function buildExtractionPrompt(
  transcript: string,
  hints?: DeterministicHints
): string {
  const schemaSection = buildSchemaSection();
  const hintsSection = buildHintsSection(hints);

  return `Analyze the following sales meeting transcript and extract structured information. Return only valid JSON matching this schema:

${schemaSection}${hintsSection}
Transcript:
${transcript}

Extract and return only the JSON object, no additional text.`;
}
