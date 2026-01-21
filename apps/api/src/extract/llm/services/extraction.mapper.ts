import {
  Extraction,
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

type ExtractionData = {
  id: string;
  extractionId: string;
  industry: string | null;
  businessModel: string | null;
  jtbdPrimary: string[];
  painPoints: string[];
  leadSource: string | null;
  processMaturity: string | null;
  toolingMaturity: string | null;
  knowledgeComplexity: string | null;
  riskLevel: string | null;
  integrations: string[];
  urgency: string | null;
  successMetrics: string[];
  objections: string[];
  sentiment: string | null;
  volumeQuantity: number | null;
  volumeUnit: string | null;
  volumeIsPeak: boolean;
  createdAt: Date;
};

function castToEnum<T extends string>(value: string | null, enumObject: Record<string, T>): T | null {
  if (!value) return null;
  return Object.values(enumObject).includes(value as T) ? (value as T) : null;
}

function castToEnumArray<T extends string>(values: string[], enumObject: Record<string, T>): T[] {
  return values
    .filter((v): v is T => Object.values(enumObject).includes(v as T))
    .map((v) => v as T);
}

export function mapExtractionDataToExtraction(data: ExtractionData | null): Extraction | null {
  if (!data) {
    return null;
  }

  return {
    industry: castToEnum(data.industry, Industry),
    businessModel: castToEnum(data.businessModel, BusinessModel),
    jtbdPrimary: castToEnumArray(data.jtbdPrimary, JtbdPrimary),
    painPoints: castToEnumArray(data.painPoints, PainPoints),
    leadSource: castToEnum(data.leadSource, LeadSource),
    processMaturity: castToEnum(data.processMaturity, ProcessMaturity),
    toolingMaturity: castToEnum(data.toolingMaturity, ToolingMaturity),
    knowledgeComplexity: castToEnum(data.knowledgeComplexity, KnowledgeComplexity),
    riskLevel: castToEnum(data.riskLevel, RiskLevel),
    integrations: castToEnumArray(data.integrations, Integrations),
    urgency: castToEnum(data.urgency, Urgency),
    successMetrics: castToEnumArray(data.successMetrics, SuccessMetric),
    objections: castToEnumArray(data.objections, Objections),
    sentiment: castToEnum(data.sentiment, Sentiment),
    volume: data.volumeQuantity !== null || data.volumeUnit !== null
      ? {
          quantity: data.volumeQuantity,
          unit: castToEnum(data.volumeUnit, VolumeUnit),
          isPeak: data.volumeIsPeak,
        }
      : null,
  };
}
