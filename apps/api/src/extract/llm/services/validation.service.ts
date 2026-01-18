import { Injectable } from "@nestjs/common";
import { Extraction, ExtractionSchema } from "@vambe/shared";

@Injectable()
export class ValidationService {
  validateAndMerge(partial: Partial<Extraction>, transcript: string): Extraction {
    const defaultExtraction: Extraction = {
      industry: null,
      businessModel: null,
      jtbdPrimary: [],
      painPoints: [],
      leadSource: null,
      processMaturity: null,
      toolingMaturity: null,
      knowledgeComplexity: null,
      riskLevel: null,
      integrations: [],
      urgency: null,
      successMetrics: [],
      objections: [],
      sentiment: null,
      volume: null,
    };

    const merged = { ...defaultExtraction, ...partial };

    if (merged.jtbdPrimary === undefined || !Array.isArray(merged.jtbdPrimary)) {
      merged.jtbdPrimary = [];
    }
    if (merged.painPoints === undefined || !Array.isArray(merged.painPoints)) {
      merged.painPoints = [];
    }
    if (merged.integrations === undefined || !Array.isArray(merged.integrations)) {
      merged.integrations = [];
    }
    if (merged.successMetrics === undefined || !Array.isArray(merged.successMetrics)) {
      merged.successMetrics = [];
    }
    if (merged.objections === undefined || !Array.isArray(merged.objections)) {
      merged.objections = [];
    }
    if (merged.volume === undefined) {
      merged.volume = null;
    }

    const result = ExtractionSchema.safeParse(merged);

    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }

    return result.data;
  }
}
