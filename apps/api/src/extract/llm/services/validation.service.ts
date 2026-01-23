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

    if (trimmed === "TECNLOGIA" && "TECNOLOGIA" in enumObject) {
      return enumObject["TECNOLOGIA"] as T;
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
    const defaultExtraction = this.createDefaultExtraction();
    const normalized = this.normalizeExtraction(partial);
    const merged = { ...defaultExtraction, ...normalized };
    return this.validateExtraction(merged);
  }

  private createDefaultExtraction(): Extraction {
    return {
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
  }

  private normalizeExtraction(partial: Partial<Extraction>): Partial<Extraction> {
    return {
      ...this.normalizeSimpleEnums(partial),
      ...this.normalizeJtbdAndPainPoints(partial),
      ...this.normalizeArrayEnums(partial),
      volume: partial.volume ?? null,
    };
  }

  private normalizeSimpleEnums(partial: Partial<Extraction>): Partial<Extraction> {
    const industryMappings: Record<string, Industry> = {
      RESTAURANT: Industry.HOSPITALIDAD,
      RESTAURANTE: Industry.HOSPITALIDAD,
    };

    return {
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
  }

  private normalizeJtbdAndPainPoints(partial: Partial<Extraction>): {
    jtbdPrimary: JtbdPrimary[];
    painPoints: PainPoints[];
  } {
    const rawJtbdPrimary = Array.isArray(partial.jtbdPrimary) ? partial.jtbdPrimary : [];
    const rawPainPoints = Array.isArray(partial.painPoints) ? partial.painPoints : [];

    const { validJtbdPrimary, misplacedToPainPoints } =
      this.processJtbdPrimary(rawJtbdPrimary);
    const normalizedPainPoints = this.normalizeEnumArray(
      rawPainPoints,
      PainPoints as Record<string, PainPoints>
    );

    return {
      jtbdPrimary: validJtbdPrimary,
      painPoints: [
        ...normalizedPainPoints,
        ...misplacedToPainPoints.filter((val) => !normalizedPainPoints.includes(val)),
      ],
    };
  }

  private processJtbdPrimary(
    rawJtbdPrimary: unknown[]
  ): { validJtbdPrimary: JtbdPrimary[]; misplacedToPainPoints: PainPoints[] } {
    const validJtbdPrimary: JtbdPrimary[] = [];
    const misplacedToPainPoints: PainPoints[] = [];
    const painPointsValues = Object.values(PainPoints) as string[];

    rawJtbdPrimary.forEach((val) => {
      if (typeof val !== "string") {
        return;
      }

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
    });

    return { validJtbdPrimary, misplacedToPainPoints };
  }

  private normalizeArrayEnums(partial: Partial<Extraction>): Partial<Extraction> {
    return {
      integrations: Array.isArray(partial.integrations)
        ? this.normalizeEnumArray(partial.integrations, Integrations as Record<string, Integrations>)
        : [],
      successMetrics: Array.isArray(partial.successMetrics)
        ? this.normalizeEnumArray(
            partial.successMetrics,
            SuccessMetric as Record<string, SuccessMetric>
          )
        : [],
      objections: Array.isArray(partial.objections)
        ? this.normalizeEnumArray(partial.objections, Objections as Record<string, Objections>)
        : [],
    };
  }

  private validateExtraction(extraction: Partial<Extraction>): Extraction {
    const result = ExtractionSchema.safeParse(extraction);

    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }

    return result.data;
  }
}
