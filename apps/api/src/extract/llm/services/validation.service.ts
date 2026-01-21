import { Injectable } from "@nestjs/common";
import {
  Extraction,
  ExtractionSchema,
  Industry,
  JtbdPrimary,
  PainPoints,
  BusinessModel,
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
} from "@vambe/shared";

@Injectable()
export class ValidationService {
  private normalizeEnumValue<T extends string>(
    value: string | null | undefined,
    enumObject: Record<string, T>,
    valueMappings?: Record<string, T>
  ): T | null {
    if (!value || typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim().toUpperCase();

    if (trimmed in enumObject) {
      return enumObject[trimmed] as T;
    }

    if (valueMappings && trimmed in valueMappings) {
      return valueMappings[trimmed];
    }

    const typoFixes: Record<string, string> = {
      TECNLOGIA: "TECNOLOGIA",
    };

    if (trimmed in typoFixes) {
      const fixed = typoFixes[trimmed];
      if (fixed in enumObject) {
        return enumObject[fixed] as T;
      }
    }

    return null;
  }

  private normalizeEnumArray<T extends string>(
    values: unknown,
    enumObject: Record<string, T>,
    valueMappings?: Record<string, T>
  ): T[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((val) => this.normalizeEnumValue(val, enumObject, valueMappings))
      .filter((val): val is T => val !== null);
  }

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

    const industryMappings: Record<string, Industry> = {
      RESTAURANT: Industry.HOSPITALIDAD,
      RESTAURANTE: Industry.HOSPITALIDAD,
    };

    const normalized: Partial<Extraction> = {
      ...defaultExtraction,
      industry: this.normalizeEnumValue(
        partial.industry,
        Industry as Record<string, Industry>,
        industryMappings
      ),
      businessModel: this.normalizeEnumValue(
        partial.businessModel,
        BusinessModel as Record<string, BusinessModel>
      ),
      leadSource: this.normalizeEnumValue(
        partial.leadSource,
        LeadSource as Record<string, LeadSource>
      ),
      processMaturity: this.normalizeEnumValue(
        partial.processMaturity,
        ProcessMaturity as Record<string, ProcessMaturity>
      ),
      toolingMaturity: this.normalizeEnumValue(
        partial.toolingMaturity,
        ToolingMaturity as Record<string, ToolingMaturity>
      ),
      knowledgeComplexity: this.normalizeEnumValue(
        partial.knowledgeComplexity,
        KnowledgeComplexity as Record<string, KnowledgeComplexity>
      ),
      riskLevel: this.normalizeEnumValue(
        partial.riskLevel,
        RiskLevel as Record<string, RiskLevel>
      ),
      urgency: this.normalizeEnumValue(
        partial.urgency,
        Urgency as Record<string, Urgency>
      ),
      sentiment: this.normalizeEnumValue(
        partial.sentiment,
        Sentiment as Record<string, Sentiment>
      ),
    };

    const rawJtbdPrimary = Array.isArray(partial.jtbdPrimary)
      ? partial.jtbdPrimary
      : [];
    const rawPainPoints = Array.isArray(partial.painPoints)
      ? partial.painPoints
      : [];

    const painPointsValues = Object.values(PainPoints) as string[];
    const validJtbdPrimary: JtbdPrimary[] = [];
    const misplacedToPainPoints: PainPoints[] = [];

    rawJtbdPrimary.forEach((val) => {
      if (typeof val === "string") {
        const trimmed = val.trim().toUpperCase();
        const asJtbd = this.normalizeEnumValue(
          trimmed,
          JtbdPrimary as Record<string, JtbdPrimary>
        );
        if (asJtbd) {
          validJtbdPrimary.push(asJtbd);
        } else if (painPointsValues.includes(trimmed)) {
          const asPainPoint = this.normalizeEnumValue(
            trimmed,
            PainPoints as Record<string, PainPoints>
          );
          if (asPainPoint && !misplacedToPainPoints.includes(asPainPoint)) {
            misplacedToPainPoints.push(asPainPoint);
          }
        }
      }
    });

    const normalizedPainPoints = this.normalizeEnumArray(
      rawPainPoints,
      PainPoints as Record<string, PainPoints>
    );

    normalized.jtbdPrimary = validJtbdPrimary;
    normalized.painPoints = [
      ...normalizedPainPoints,
      ...misplacedToPainPoints.filter(
        (val) => !normalizedPainPoints.includes(val)
      ),
    ];

    if (Array.isArray(partial.integrations)) {
      normalized.integrations = this.normalizeEnumArray(
        partial.integrations,
        Integrations as Record<string, Integrations>
      );
    }
    if (Array.isArray(partial.successMetrics)) {
      normalized.successMetrics = this.normalizeEnumArray(
        partial.successMetrics,
        SuccessMetric as Record<string, SuccessMetric>
      );
    }
    if (Array.isArray(partial.objections)) {
      normalized.objections = this.normalizeEnumArray(
        partial.objections,
        Objections as Record<string, Objections>
      );
    }

    if (partial.volume !== undefined) {
      normalized.volume = partial.volume;
    }

    const merged = { ...defaultExtraction, ...normalized };

    const result = ExtractionSchema.safeParse(merged);

    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }

    return result.data;
  }
}
