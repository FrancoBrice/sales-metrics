import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { CustomerWithRelations } from "../../common/types";
import { BaseMetricsService } from "./base-metrics.service";
import { InsightsService } from "./insights";
import { ClosureAnalysisService, CategoryStats } from "./closure-analysis.service";
import {
  classifyCustomersIntoStages,
  calculateStageMetrics,
  calculateBreakdown,
  extractTopPerformers,
  calculateTimeSeries,
  calculateUrgencySentimentMetrics,
} from "./closure-insights/helpers";

const STAGE_NAMES = [
  "Lead Generation",
  "Qualification",
  "Needs Assessment",
  "Proposal Development",
  "Closure",
] as const;

@Injectable()
export class ClosureInsightsService extends BaseMetricsService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
    private readonly closureAnalysisService: ClosureAnalysisService
  ) {
    super(prisma);
  }

  async getClosureInsights(filter: MetricsFilterDto): Promise<{
    bottlenecks: string[];
    opportunities: string[];
    recommendations: string[];
    dataQuality: {
      topPerformers: CategoryStats[];
      underperformers: CategoryStats[];
      significantFindings: Array<{
        category: string;
        dimension: string;
        significance: "high" | "medium" | "low";
        reasoning: string;
      }>;
    };
  }> {
    const customers = await this.getCustomers(filter);
    const getExtraction = (customer: CustomerWithRelations) => this.getExtraction(customer);

    const stages = classifyCustomersIntoStages(customers, getExtraction);
    const stageMetrics = calculateStageMetrics(stages);
    const conversionTrend = calculateTimeSeries(customers);
    const breakdown = calculateBreakdown(stages.stage1Leads, getExtraction);
    const topPerformers = extractTopPerformers(breakdown.byLeadSource);
    const urgencySentimentData = calculateUrgencySentimentMetrics(customers, getExtraction);

    const insightsData = this.buildInsightsData(
      stageMetrics,
      conversionTrend,
      breakdown,
      topPerformers,
      urgencySentimentData
    );

    const closureAnalysis = await this.closureAnalysisService.getClosureAnalysis(filter);
    const enhancedInsightsData = this.enhanceWithClosureAnalysis(insightsData, closureAnalysis, filter);
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

  private buildInsightsData(
    stageMetrics: ReturnType<typeof calculateStageMetrics>,
    conversionTrend: ReturnType<typeof calculateTimeSeries>,
    breakdown: ReturnType<typeof calculateBreakdown>,
    topPerformers: string[],
    urgencySentimentData: ReturnType<typeof calculateUrgencySentimentMetrics>
  ) {
    return {
      stages: [
        { name: STAGE_NAMES[0], ...stageMetrics.stage1 },
        { name: STAGE_NAMES[1], ...stageMetrics.stage2 },
        { name: STAGE_NAMES[2], ...stageMetrics.stage3 },
        { name: STAGE_NAMES[3], ...stageMetrics.stage4 },
        { name: STAGE_NAMES[4], ...stageMetrics.stage5 },
      ],
      breakdown,
      topPerformers,
      trends: conversionTrend,
      urgencySentiment: urgencySentimentData,
    };
  }

  private enhanceWithClosureAnalysis(
    insightsData: ReturnType<typeof this.buildInsightsData>,
    closureAnalysis: Awaited<ReturnType<typeof this.closureAnalysisService.getClosureAnalysis>>,
    filter: MetricsFilterDto
  ) {
    return {
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
  }
}
