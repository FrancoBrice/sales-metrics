import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { CustomerWithRelations } from "../../common/types";
import { UNKNOWN_VALUE } from "../../common/constants";
import { calculateConversionRateRounded } from "../../common/helpers/metrics.helper";

export interface CategoryStats {
  category: string;
  total: number;
  closed: number;
  conversionRate: number;
  confidence: number;
  volume: number;
}

export interface ClosureAnalysisResult {
  byLeadSource: CategoryStats[];
  byIndustry: CategoryStats[];
  byJTBD: CategoryStats[];
  byPainPoint: CategoryStats[];
  bySeller: CategoryStats[];
  byToolingMaturity: CategoryStats[];
  byKnowledgeComplexity: CategoryStats[];
  bySuccessMetrics: CategoryStats[];
  overall: {
    total: number;
    closed: number;
    conversionRate: number;
  };
  insights: {
    topPerformers: CategoryStats[];
    underperformers: CategoryStats[];
    highVolumeOpportunities: CategoryStats[];
    statisticalSignificance: Array<{
      category: string;
      dimension: string;
      significance: "high" | "medium" | "low";
      reasoning: string;
    }>;
  };
}

@Injectable()
export class ClosureAnalysisService extends BaseMetricsService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async getClosureAnalysis(filter: MetricsFilterDto): Promise<ClosureAnalysisResult> {
    const customers = await this.getCustomers(filter);

    const byLeadSource: Record<string, { total: number; closed: number }> = {};
    const byIndustry: Record<string, { total: number; closed: number }> = {};
    const byJTBD: Record<string, { total: number; closed: number }> = {};
    const byPainPoint: Record<string, { total: number; closed: number }> = {};
    const bySeller: Record<string, { total: number; closed: number }> = {};
    const byToolingMaturity: Record<string, { total: number; closed: number }> = {};
    const byKnowledgeComplexity: Record<string, { total: number; closed: number }> = {};
    const bySuccessMetrics: Record<string, { total: number; closed: number }> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);

      const leadSource = extraction?.leadSource || UNKNOWN_VALUE;
      this.addToCategory(byLeadSource, leadSource, customer.closed);

      if (extraction?.industry) {
        this.addToCategory(byIndustry, extraction.industry, customer.closed);
      }

      if (extraction?.jtbdPrimary && extraction.jtbdPrimary.length > 0) {
        for (const jtbd of extraction.jtbdPrimary) {
          this.addToCategory(byJTBD, jtbd, customer.closed);
        }
      }

      if (extraction?.painPoints && extraction.painPoints.length > 0) {
        for (const painPoint of extraction.painPoints) {
          this.addToCategory(byPainPoint, painPoint, customer.closed);
        }
      }

      if (extraction?.toolingMaturity) {
        this.addToCategory(byToolingMaturity, extraction.toolingMaturity, customer.closed);
      }

      if (extraction?.knowledgeComplexity) {
        this.addToCategory(byKnowledgeComplexity, extraction.knowledgeComplexity, customer.closed);
      }

      if (extraction?.successMetrics && extraction.successMetrics.length > 0) {
        for (const metric of extraction.successMetrics) {
          this.addToCategory(bySuccessMetrics, metric, customer.closed);
        }
      }

      this.addToCategory(bySeller, customer.seller, customer.closed);
    }

    const overallClosed = customers.filter((c) => c.closed).length;
    const overallTotal = customers.length;
    const overallConversionRate = calculateConversionRateRounded(overallTotal, overallClosed);

    const convertToStats = (
      categoryData: Record<string, { total: number; closed: number }>,
      overallRate: number
    ): CategoryStats[] => {
      return Object.entries(categoryData)
        .map(([category, data]) => {
          const conversionRate = calculateConversionRateRounded(data.total, data.closed);
          const confidence = this.calculateConfidence(data.total, data.closed, overallRate);

          return {
            category,
            total: data.total,
            closed: data.closed,
            conversionRate,
            confidence,
            volume: 0,
          };
        })
        .sort((a, b) => b.total - a.total);
    };

    const leadSourceStats = convertToStats(byLeadSource, overallConversionRate);
    const industryStats = convertToStats(byIndustry, overallConversionRate);
    const jtbdStats = convertToStats(byJTBD, overallConversionRate);
    const painPointStats = convertToStats(byPainPoint, overallConversionRate);
    const sellerStats = convertToStats(bySeller, overallConversionRate);
    const toolingMaturityStats = convertToStats(byToolingMaturity, overallConversionRate);
    const knowledgeComplexityStats = convertToStats(byKnowledgeComplexity, overallConversionRate);
    const successMetricsStats = convertToStats(bySuccessMetrics, overallConversionRate);

    const allStatsWithDimension = [
      ...leadSourceStats.map((s) => ({ ...s, dimension: "leadSource" as const })),
      ...industryStats.map((s) => ({ ...s, dimension: "industry" as const })),
      ...jtbdStats.map((s) => ({ ...s, dimension: "jtbd" as const })),
      ...painPointStats.map((s) => ({ ...s, dimension: "painPoint" as const })),
      ...sellerStats.map((s) => ({ ...s, dimension: "seller" as const })),
      ...toolingMaturityStats.map((s) => ({ ...s, dimension: "toolingMaturity" as const })),
      ...knowledgeComplexityStats.map((s) => ({ ...s, dimension: "knowledgeComplexity" as const })),
      ...successMetricsStats.map((s) => ({ ...s, dimension: "successMetrics" as const })),
    ];

    const topPerformers = allStatsWithDimension
      .filter((s) => s.total >= 3 && s.conversionRate > overallConversionRate + 10)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5)
      .map(({ dimension, ...rest }) => rest);

    const underperformers = allStatsWithDimension
      .filter((s) => s.total >= 3 && s.conversionRate < overallConversionRate - 10)
      .sort((a, b) => a.conversionRate - b.conversionRate)
      .slice(0, 5)
      .map(({ dimension, ...rest }) => rest);

    const highVolumeOpportunities = allStatsWithDimension
      .filter((s) => s.total >= 5 && s.volume > 0 && s.conversionRate < overallConversionRate)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(({ dimension, ...rest }) => rest);

    const statisticalSignificance = allStatsWithDimension
      .filter((s) => s.total >= 3)
      .map((stat) => {
        const significance = this.evaluateStatisticalSignificance(
          stat.total,
          stat.closed,
          overallConversionRate
        );
        return {
          category: stat.category,
          dimension: stat.dimension,
          significance: significance.level,
          reasoning: significance.reasoning,
        };
      })
      .filter((s) => s.significance !== "low")
      .slice(0, 10);

    return {
      byLeadSource: leadSourceStats,
      byIndustry: industryStats,
      byJTBD: jtbdStats,
      byPainPoint: painPointStats,
      bySeller: sellerStats,
      byToolingMaturity: toolingMaturityStats,
      byKnowledgeComplexity: knowledgeComplexityStats,
      bySuccessMetrics: successMetricsStats,
      overall: {
        total: overallTotal,
        closed: overallClosed,
        conversionRate: Math.round(overallConversionRate * 10) / 10,
      },
      insights: {
        topPerformers,
        underperformers,
        highVolumeOpportunities,
        statisticalSignificance,
      },
    };
  }

  private addToCategory(
    category: Record<string, { total: number; closed: number }>,
    key: string,
    isClosed: boolean
  ) {
    if (!category[key]) {
      category[key] = { total: 0, closed: 0 };
    }
    category[key].total++;
    if (isClosed) {
      category[key].closed++;
    }
  }

  private calculateConfidence(
    sampleSize: number,
    closed: number,
    overallRate: number
  ): number {
    if (sampleSize < 3) return 0;
    if (sampleSize >= 30) return 100;

    const sampleRate = sampleSize > 0 ? (closed / sampleSize) * 100 : 0;
    const difference = Math.abs(sampleRate - overallRate);
    const baseConfidence = Math.min((sampleSize / 30) * 100, 100);
    const rateStability = difference > 20 ? 0.7 : difference > 10 ? 0.85 : 1;

    return Math.round(baseConfidence * rateStability);
  }

  private evaluateStatisticalSignificance(
    sampleSize: number,
    closed: number,
    overallRate: number
  ): { level: "high" | "medium" | "low"; reasoning: string } {
    if (sampleSize < 3) {
      return { level: "low", reasoning: "Muestra muy pequeña (< 3)" };
    }

    const sampleRate = (closed / sampleSize) * 100;
    const difference = Math.abs(sampleRate - overallRate);
    const percentageDiff = (difference / overallRate) * 100;

    if (sampleSize >= 10 && percentageDiff > 30) {
      return {
        level: "high",
        reasoning: `Muestra grande (${sampleSize}) con diferencia significativa (${percentageDiff.toFixed(1)}%)`,
      };
    }

    if (sampleSize >= 5 && percentageDiff > 20) {
      return {
        level: "medium",
        reasoning: `Muestra moderada (${sampleSize}) con diferencia notable (${percentageDiff.toFixed(1)}%)`,
      };
    }

    return { level: "low", reasoning: "Diferencia no significativa o muestra insuficiente" };
  }
}
