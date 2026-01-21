import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { CustomerWithRelations } from "../../common/types";
import { BaseMetricsService } from "./base-metrics.service";
import { UNKNOWN_VALUE } from "../../common/constants";
import { InsightsService } from "./insights";
import { ClosureAnalysisService, CategoryStats } from "./closure-analysis.service";

type StageCustomers = {
  stage1Leads: CustomerWithRelations[];
  stage2Qualified: CustomerWithRelations[];
  stage3NeedsAssessed: CustomerWithRelations[];
  stage4Proposal: CustomerWithRelations[];
  stage5Closure: CustomerWithRelations[];
};

type CategoryBreakdown = {
  byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }>;
  byJTBD: Record<string, { total: number; closed: number; conversionRate: number }>;
  byIndustry: Record<string, { total: number; closed: number; conversionRate: number }>;
};


@Injectable()
export class SalesFunnelService extends BaseMetricsService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
    private readonly closureAnalysisService: ClosureAnalysisService
  ) {
    super(prisma);
  }

  async getSalesFunnelInsights(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);
    const stages = this.classifyCustomersIntoStages(customers);
    const stageMetrics = this.calculateBasicStageMetrics(stages);

    const { conversionTrend } = this.calculateTimeSeries(customers);
    const breakdown = this.calculateBreakdown(stages.stage1Leads);
    const topPerformers = this.extractTopPerformers(breakdown.byLeadSource, 3);

    const urgencySentimentData = this.calculateUrgencySentimentMetrics(customers);

    const insightsData = {
      stages: [
        {
          name: "Lead Generation",
          total: stageMetrics.stage1.total,
          closed: stageMetrics.stage1.closed,
          conversionRate: stageMetrics.stage1.conversionRate,
          dropOffRate: stageMetrics.stage1.dropOffRate,
        },
        {
          name: "Qualification",
          total: stageMetrics.stage2.total,
          closed: stageMetrics.stage2.closed,
          conversionRate: stageMetrics.stage2.conversionRate,
          dropOffRate: stageMetrics.stage2.dropOffRate,
        },
        {
          name: "Needs Assessment",
          total: stageMetrics.stage3.total,
          closed: stageMetrics.stage3.closed,
          conversionRate: stageMetrics.stage3.conversionRate,
          dropOffRate: stageMetrics.stage3.dropOffRate,
        },
        {
          name: "Proposal Development",
          total: stageMetrics.stage4.total,
          closed: stageMetrics.stage4.closed,
          conversionRate: stageMetrics.stage4.conversionRate,
          dropOffRate: stageMetrics.stage4.dropOffRate,
        },
        {
          name: "Closure",
          total: stageMetrics.stage5.total,
          closed: stageMetrics.stage5.closed,
          conversionRate: stageMetrics.stage5.conversionRate,
          dropOffRate: stageMetrics.stage5.dropOffRate,
        },
      ],
      breakdown,
      topPerformers,
      trends: {
        conversionTrend,
      },
      urgencySentiment: urgencySentimentData,
    };

    const closureAnalysis = await this.closureAnalysisService.getClosureAnalysis(filter);

    const enhancedInsightsData = {
      ...insightsData,
      statisticalAnalysis: {
        topPerformers: closureAnalysis.insights.topPerformers.map((p) => ({
          category: p.category,
          conversionRate: p.conversionRate,
          total: p.total,
          closed: p.closed,
        })),
        underperformers: closureAnalysis.insights.underperformers.map((u) => ({
          category: u.category,
          conversionRate: u.conversionRate,
          total: u.total,
          closed: u.closed,
        })),
        highVolumeOpportunities: closureAnalysis.insights.highVolumeOpportunities.map((o) => ({
          category: o.category,
          volume: o.volume,
          conversionRate: o.conversionRate,
          total: o.total,
        })),
        significantFindings: closureAnalysis.insights.statisticalSignificance,
      },
      overallMetrics: closureAnalysis.overall,
      filters: {
        seller: filter.seller,
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
      },
    };

    const insights = await this.insightsService.generateInsights(enhancedInsightsData, true);

    return {
      bottlenecks: insights.bottlenecks,
      opportunities: insights.opportunities,
      recommendations: insights.recommendations,
      dataQuality: {
        topPerformers: closureAnalysis.insights.topPerformers as CategoryStats[],
        underperformers: closureAnalysis.insights.underperformers as CategoryStats[],
        significantFindings: closureAnalysis.insights.statisticalSignificance,
      },
    };
  }

  private classifyCustomersIntoStages(customers: CustomerWithRelations[]): StageCustomers {
    const stages: StageCustomers = {
      stage1Leads: [],
      stage2Qualified: [],
      stage3NeedsAssessed: [],
      stage4Proposal: [],
      stage5Closure: [],
    };

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);

      if (customer.meetings.length === 0) {
        continue;
      }

      stages.stage1Leads.push(customer);

      if (!extraction) {
        continue;
      }

      const hasQualificationData = extraction.urgency || extraction.riskLevel || (extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0);
      const hasNeedsData = extraction.industry || (extraction.painPoints && extraction.painPoints.length > 0) || extraction.businessModel;
      const hasProposalData = (extraction.objections && extraction.objections.length > 0) || extraction.processMaturity || (extraction.integrations && extraction.integrations.length > 0);
      const hasClosureData = extraction.sentiment || (extraction.successMetrics && extraction.successMetrics.length > 0);

      if (hasQualificationData) {
        stages.stage2Qualified.push(customer);
      }

      if (hasNeedsData) {
        stages.stage3NeedsAssessed.push(customer);
      }

      if (hasProposalData) {
        stages.stage4Proposal.push(customer);
      }

      if (hasClosureData) {
        stages.stage5Closure.push(customer);
      }
    }

    return stages;
  }


  private calculateBasicStageMetrics(stages: StageCustomers): {
    stage1: { total: number; closed: number; conversionRate: number; dropOffRate: number };
    stage2: { total: number; closed: number; conversionRate: number; dropOffRate: number };
    stage3: { total: number; closed: number; conversionRate: number; dropOffRate: number };
    stage4: { total: number; closed: number; conversionRate: number; dropOffRate: number };
    stage5: { total: number; closed: number; conversionRate: number; dropOffRate: number };
  } {
    return {
      stage1: this.calculateBasicMetrics(stages.stage1Leads, []),
      stage2: this.calculateBasicMetrics(stages.stage2Qualified, stages.stage1Leads),
      stage3: this.calculateBasicMetrics(stages.stage3NeedsAssessed, stages.stage2Qualified),
      stage4: this.calculateBasicMetrics(stages.stage4Proposal, stages.stage3NeedsAssessed),
      stage5: this.calculateBasicMetrics(stages.stage5Closure, stages.stage4Proposal),
    };
  }


  private calculateBasicMetrics(
    stageCustomers: CustomerWithRelations[],
    previousStageCustomers: CustomerWithRelations[]
  ): { total: number; closed: number; conversionRate: number; progressionRate: number; dropOffRate: number } {
    const total = stageCustomers.length;
    const closed = stageCustomers.filter((c) => c.closed).length;
    const conversionRate = this.calculateConversionRate(total, closed);
    const progressionRate = previousStageCustomers.length > 0
      ? (total / previousStageCustomers.length) * 100
      : 100;
    const dropOffRate = previousStageCustomers.length > 0
      ? ((previousStageCustomers.length - total) / previousStageCustomers.length) * 100
      : 0;

    return {
      total,
      closed,
      conversionRate: this.roundToOneDecimal(conversionRate),
      progressionRate: this.roundToOneDecimal(progressionRate),
      dropOffRate: this.roundToOneDecimal(dropOffRate),
    };
  }

  private calculateBreakdown(customers: CustomerWithRelations[]): CategoryBreakdown {
    const byLeadSource: Record<string, { total: number; closed: number }> = {};
    const byJTBD: Record<string, { total: number; closed: number }> = {};
    const byIndustry: Record<string, { total: number; closed: number }> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);

      const leadSource = extraction?.leadSource || UNKNOWN_VALUE;
      this.incrementCategoryStats(byLeadSource, leadSource, customer.closed);

      if (extraction?.jtbdPrimary && extraction.jtbdPrimary.length > 0) {
        for (const jtbd of extraction.jtbdPrimary) {
          this.incrementCategoryStats(byJTBD, jtbd, customer.closed);
        }
      }

      if (extraction?.industry) {
        this.incrementCategoryStats(byIndustry, extraction.industry, customer.closed);
      }
    }

    return {
      byLeadSource: this.calculateConversionRates(byLeadSource),
      byJTBD: this.calculateConversionRates(byJTBD),
      byIndustry: this.calculateConversionRates(byIndustry),
    };
  }

  private incrementCategoryStats(
    category: Record<string, { total: number; closed: number }>,
    key: string,
    isClosed: boolean
  ): void {
    if (!category[key]) {
      category[key] = { total: 0, closed: 0 };
    }
    category[key].total++;
    if (isClosed) {
      category[key].closed++;
    }
  }

  private calculateConversionRates(
    category: Record<string, { total: number; closed: number }>
  ): Record<string, { total: number; closed: number; conversionRate: number }> {
    const result: Record<string, { total: number; closed: number; conversionRate: number }> = {};
    for (const key in category) {
      result[key] = {
        ...category[key],
        conversionRate: this.calculateConversionRate(category[key].total, category[key].closed),
      };
    }
    return result;
  }

  private calculateConversionRate(total: number, closed: number): number {
    return total > 0 ? (closed / total) * 100 : 0;
  }

  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private extractTopPerformers(
    byLeadSource: Record<string, { conversionRate: number }>,
    limit: number
  ): string[] {
    return Object.entries(byLeadSource)
      .map(([source, stats]) => ({ source, conversionRate: stats.conversionRate }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limit)
      .map((item) => item.source);
  }

  private calculateTimeSeries(customers: CustomerWithRelations[]): {
    conversionTrend: Array<{ period: string; conversionRate: number }>;
  } {
    const timeSeriesMap = new Map<string, { total: number; closed: number }>();

    for (const customer of customers) {
      const date = new Date(customer.meetingDate);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!timeSeriesMap.has(period)) {
        timeSeriesMap.set(period, { total: 0, closed: 0 });
      }

      const periodData = timeSeriesMap.get(period)!;
      periodData.total++;
      if (customer.closed) {
        periodData.closed++;
      }
    }

    const conversionTrend = Array.from(timeSeriesMap.entries())
      .map(([period, data]) => ({
        period,
        conversionRate: this.roundToOneDecimal(this.calculateConversionRate(data.total, data.closed)),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { conversionTrend };
  }

  private calculateUrgencySentimentMetrics(customers: CustomerWithRelations[]): {
    byUrgency: Record<string, { total: number; closed: number; conversionRate: number }>;
    bySentiment: Record<string, { total: number; closed: number; conversionRate: number }>;
    matrix: Array<{ urgency: string; sentiment: string; total: number; closed: number; conversionRate: number }>;
  } {
    const urgencyStats: Record<string, { total: number; closed: number }> = {};
    const sentimentStats: Record<string, { total: number; closed: number }> = {};
    const urgencySentimentMatrix: Record<string, Record<string, { total: number; closed: number }>> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const urgency = extraction.urgency || "MEDIA";
      const sentiment = extraction.sentiment || "NEUTRAL";

      this.incrementCategoryStats(urgencyStats, urgency, customer.closed);
      this.incrementCategoryStats(sentimentStats, sentiment, customer.closed);

      if (!urgencySentimentMatrix[urgency]) {
        urgencySentimentMatrix[urgency] = {};
      }
      if (!urgencySentimentMatrix[urgency][sentiment]) {
        urgencySentimentMatrix[urgency][sentiment] = { total: 0, closed: 0 };
      }
      urgencySentimentMatrix[urgency][sentiment].total++;
      if (customer.closed) {
        urgencySentimentMatrix[urgency][sentiment].closed++;
      }
    }

    const byUrgency = this.calculateConversionRates(urgencyStats);
    const bySentiment = this.calculateConversionRates(sentimentStats);

    const matrix = Object.entries(urgencySentimentMatrix).flatMap(([urgency, sentiments]) =>
      Object.entries(sentiments).map(([sentiment, stats]) => ({
        urgency,
        sentiment,
        total: stats.total,
        closed: stats.closed,
        conversionRate: this.roundToOneDecimal(this.calculateConversionRate(stats.total, stats.closed)),
      }))
    );

    return { byUrgency, bySentiment, matrix };
  }

}
