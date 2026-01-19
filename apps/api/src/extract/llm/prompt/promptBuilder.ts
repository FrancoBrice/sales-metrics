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

  return `\n\n=== PRE-EXTRACTED VALUES ===
These values were extracted using deterministic methods. Use them as-is if they match the transcript context, otherwise extract from the transcript:
${hintParts.join("\n")}\n`;
}

function buildInstructionsSection(): string {
  return `=== EXTRACTION INSTRUCTIONS ===

1. ROLE: Act as an expert sales analyst specializing in B2B SaaS customer conversations.

2. EXTRACTION GUIDELINES:
   - Extract only information explicitly mentioned or clearly implied in the transcript
   - Use null for fields with no clear evidence (never guess or infer)
   - For arrays (jtbdPrimary, painPoints, integrations, etc.), include all relevant items found
   - Return empty arrays [] when no items are found (not null)

3. FIELD-SPECIFIC GUIDANCE:
   - jtbdPrimary: Identify primary jobs-to-be-done (e.g., MULTIIDIOMA if mentions "múltiples idiomas" or "zonas horarias")
   - painPoints: Extract all pain points mentioned (e.g., VOLUMEN_ALTO, CONSULTAS_REPETITIVAS, SOBRECARGA_EQUIPO)
   - objections: Include concerns raised (e.g., CONFIDENCIALIDAD if privacy/security mentioned, COSTO if pricing concern)
   - sentiment: Overall tone (POSITIVO, NEUTRAL, ESCEPTICO)
   - urgency: Time sensitivity (BAJA, MEDIA, ALTA, INMEDIATA)
   - riskLevel: Project risk assessment based on complexity and commitment level

4. OUTPUT FORMAT:
   - Return ONLY valid JSON matching the schema
   - No explanatory text, comments, or markdown formatting
   - Ensure all enum values match exactly (case-sensitive)
   - Use null for optional single fields, [] for optional arrays`;
}

export function buildExtractionPrompt(
  transcript: string,
  hints?: DeterministicHints
): string {
  const schemaSection = buildSchemaSection();
  const hintsSection = buildHintsSection(hints);
  const instructionsSection = buildInstructionsSection();

  return `You are an expert sales analyst. Extract structured information from the sales meeting transcript below.

${instructionsSection}

=== OUTPUT SCHEMA ===
${schemaSection}
${hintsSection}
=== TRANSCRIPT ===
${transcript}

=== OUTPUT ===
Return only the JSON object matching the schema above. No additional text.`;
}
