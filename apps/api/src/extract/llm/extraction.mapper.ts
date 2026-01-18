import { Extraction } from "@vambe/shared";

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

export function mapExtractionDataToExtraction(data: ExtractionData | null): Extraction | null {
  if (!data) {
    return null;
  }

  return {
    industry: data.industry as any,
    businessModel: data.businessModel as any,
    jtbdPrimary: data.jtbdPrimary as any[],
    painPoints: data.painPoints as any[],
    leadSource: data.leadSource as any,
    processMaturity: data.processMaturity as any,
    toolingMaturity: data.toolingMaturity as any,
    knowledgeComplexity: data.knowledgeComplexity as any,
    riskLevel: data.riskLevel as any,
    integrations: data.integrations as any[],
    urgency: data.urgency as any,
    successMetrics: data.successMetrics as any[],
    objections: data.objections as any[],
    sentiment: data.sentiment as any,
    volume: data.volumeQuantity !== null || data.volumeUnit !== null
      ? {
          quantity: data.volumeQuantity,
          unit: data.volumeUnit as any,
          isPeak: data.volumeIsPeak,
        }
      : null,
  };
}