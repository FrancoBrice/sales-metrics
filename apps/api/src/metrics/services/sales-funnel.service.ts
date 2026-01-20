import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { CustomerWithRelations } from "../../common/types";
import { BaseMetricsService } from "./base-metrics.service";
import { UNKNOWN_VALUE } from "../../common/constants";
import { InsightsService } from "./insights";
import { ClosureAnalysisService, CategoryStats } from "./closure-analysis.service";

@Injectable()
export class SalesFunnelService extends BaseMetricsService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
    private readonly closureAnalysisService: ClosureAnalysisService
  ) {
    super(prisma);
  }

  async getSalesFunnelEnhanced(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const stage1Leads: CustomerWithRelations[] = [];
    const stage2Qualified: CustomerWithRelations[] = [];
    const stage3NeedsAssessed: CustomerWithRelations[] = [];
    const stage4Proposal: CustomerWithRelations[] = [];
    const stage5Closure: CustomerWithRelations[] = [];

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);

      if (customer.meetings.length === 0) {
        continue;
      }

      stage1Leads.push(customer);

      if (!extraction) {
        continue;
      }

      const hasQualificationData = extraction.urgency || extraction.riskLevel || (extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0);
      const hasNeedsData = extraction.industry || (extraction.painPoints && extraction.painPoints.length > 0) || extraction.businessModel;
      const hasProposalData = (extraction.objections && extraction.objections.length > 0) || extraction.processMaturity || (extraction.integrations && extraction.integrations.length > 0);
      const hasClosureData = extraction.sentiment || (extraction.successMetrics && extraction.successMetrics.length > 0);

      if (hasQualificationData) {
        stage2Qualified.push(customer);
      }

      if (hasNeedsData) {
        stage3NeedsAssessed.push(customer);
      }

      if (hasProposalData) {
        stage4Proposal.push(customer);
      }

      if (hasClosureData) {
        stage5Closure.push(customer);
      }
    }

    const calculateStageMetrics = (
      stageCustomers: CustomerWithRelations[],
      previousStageCustomers: CustomerWithRelations[]
    ) => {
      const total = stageCustomers.length;
      const closed = stageCustomers.filter((c) => c.closed).length;
      const stageConversionRate = total > 0
        ? (closed / total) * 100
        : 0;
      const progressionRate = previousStageCustomers.length > 0
        ? (total / previousStageCustomers.length) * 100
        : 100;
      const dropOffRate = previousStageCustomers.length > 0
        ? ((previousStageCustomers.length - total) / previousStageCustomers.length) * 100
        : 0;

      const byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }> = {};
      const byJTBD: Record<string, { total: number; closed: number; conversionRate: number }> = {};
      const byIndustry: Record<string, { total: number; closed: number; conversionRate: number }> = {};

      for (const customer of stageCustomers) {
        const extraction = this.getExtraction(customer);

        const leadSource = extraction?.leadSource || UNKNOWN_VALUE;
        if (!byLeadSource[leadSource]) {
          byLeadSource[leadSource] = { total: 0, closed: 0, conversionRate: 0 };
        }
        byLeadSource[leadSource].total++;
        if (customer.closed) {
          byLeadSource[leadSource].closed++;
        }

        if (extraction?.jtbdPrimary && extraction.jtbdPrimary.length > 0) {
          for (const jtbd of extraction.jtbdPrimary) {
            if (!byJTBD[jtbd]) {
              byJTBD[jtbd] = { total: 0, closed: 0, conversionRate: 0 };
            }
            byJTBD[jtbd].total++;
            if (customer.closed) {
              byJTBD[jtbd].closed++;
            }
          }
        }

        if (extraction?.industry) {
          if (!byIndustry[extraction.industry]) {
            byIndustry[extraction.industry] = { total: 0, closed: 0, conversionRate: 0 };
          }
          byIndustry[extraction.industry].total++;
          if (customer.closed) {
            byIndustry[extraction.industry].closed++;
          }
        }
      }

      for (const key in byLeadSource) {
        byLeadSource[key].conversionRate = byLeadSource[key].total > 0
          ? (byLeadSource[key].closed / byLeadSource[key].total) * 100
          : 0;
      }

      for (const key in byJTBD) {
        byJTBD[key].conversionRate = byJTBD[key].total > 0
          ? (byJTBD[key].closed / byJTBD[key].total) * 100
          : 0;
      }

      for (const key in byIndustry) {
        byIndustry[key].conversionRate = byIndustry[key].total > 0
          ? (byIndustry[key].closed / byIndustry[key].total) * 100
          : 0;
      }

      const topPerformers = Object.entries(byLeadSource)
        .map(([source, stats]) => ({ source, conversionRate: stats.conversionRate }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 3)
        .map((item) => item.source);

      return {
        total,
        closed,
        conversionRate: Math.round(stageConversionRate * 10) / 10,
        progressionRate: Math.round(progressionRate * 10) / 10,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
        breakdown: {
          byLeadSource,
          byJTBD,
          byIndustry,
        },
        topPerformers,
      };
    };

    const stage1Metrics = calculateStageMetrics(stage1Leads, []);
    const stage2Metrics = calculateStageMetrics(stage2Qualified, stage1Leads);
    const stage3Metrics = calculateStageMetrics(stage3NeedsAssessed, stage2Qualified);
    const stage4Metrics = calculateStageMetrics(stage4Proposal, stage3NeedsAssessed);
    const stage5Metrics = calculateStageMetrics(stage5Closure, stage4Proposal);

    const timeSeriesMap = new Map<string, { total: number; closed: number }>();
    const leadSourceEvolution: Record<string, Map<string, number>> = {};

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

      const extraction = this.getExtraction(customer);
      const source = extraction?.leadSource || UNKNOWN_VALUE;

      if (!leadSourceEvolution[source]) {
        leadSourceEvolution[source] = new Map();
      }

      const sourceMap = leadSourceEvolution[source];
      sourceMap.set(period, (sourceMap.get(period) || 0) + 1);
    }

    const conversionTrend = Array.from(timeSeriesMap.entries())
      .map(([period, data]) => ({
        period,
        conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const leadSourceEvolutionFormatted: Record<string, Array<{ period: string; count: number }>> = {};
    for (const source in leadSourceEvolution) {
      leadSourceEvolutionFormatted[source] = Array.from(leadSourceEvolution[source].entries())
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }

    const stagesData = [
      {
        name: "Lead Generation",
        total: stage1Metrics.total,
        closed: stage1Metrics.closed,
        conversionRate: stage1Metrics.conversionRate,
        progressionRate: stage1Metrics.progressionRate,
        breakdown: stage1Metrics.breakdown,
        topPerformers: stage1Metrics.topPerformers,
        dropOffRate: stage1Metrics.dropOffRate,
      },
      {
        name: "Qualification",
        total: stage2Metrics.total,
        closed: stage2Metrics.closed,
        conversionRate: stage2Metrics.conversionRate,
        progressionRate: stage2Metrics.progressionRate,
        breakdown: stage2Metrics.breakdown,
        topPerformers: stage2Metrics.topPerformers,
        dropOffRate: stage2Metrics.dropOffRate,
      },
      {
        name: "Needs Assessment",
        total: stage3Metrics.total,
        closed: stage3Metrics.closed,
        conversionRate: stage3Metrics.conversionRate,
        progressionRate: stage3Metrics.progressionRate,
        breakdown: stage3Metrics.breakdown,
        topPerformers: stage3Metrics.topPerformers,
        dropOffRate: stage3Metrics.dropOffRate,
      },
      {
        name: "Proposal Development",
        total: stage4Metrics.total,
        closed: stage4Metrics.closed,
        conversionRate: stage4Metrics.conversionRate,
        progressionRate: stage4Metrics.progressionRate,
        breakdown: stage4Metrics.breakdown,
        topPerformers: stage4Metrics.topPerformers,
        dropOffRate: stage4Metrics.dropOffRate,
      },
      {
        name: "Closure",
        total: stage5Metrics.total,
        closed: stage5Metrics.closed,
        conversionRate: stage5Metrics.conversionRate,
        progressionRate: stage5Metrics.progressionRate,
        breakdown: stage5Metrics.breakdown,
        topPerformers: stage5Metrics.topPerformers,
        dropOffRate: stage5Metrics.dropOffRate,
      },
    ];

    return {
      stages: stagesData,
      trends: {
        conversionTrend,
        leadSourceEvolution: leadSourceEvolutionFormatted,
      },
    };
  }

  async getSalesFunnelInsights(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const stage1Leads: CustomerWithRelations[] = [];
    const stage2Qualified: CustomerWithRelations[] = [];
    const stage3NeedsAssessed: CustomerWithRelations[] = [];
    const stage4Proposal: CustomerWithRelations[] = [];
    const stage5Closure: CustomerWithRelations[] = [];

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);

      if (customer.meetings.length === 0) {
        continue;
      }

      stage1Leads.push(customer);

      if (!extraction) {
        continue;
      }

      const hasQualificationData = extraction.urgency || extraction.riskLevel || (extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0);
      const hasNeedsData = extraction.industry || (extraction.painPoints && extraction.painPoints.length > 0) || extraction.businessModel;
      const hasProposalData = (extraction.objections && extraction.objections.length > 0) || extraction.processMaturity || (extraction.integrations && extraction.integrations.length > 0);
      const hasClosureData = extraction.sentiment || (extraction.successMetrics && extraction.successMetrics.length > 0);

      if (hasQualificationData) {
        stage2Qualified.push(customer);
      }

      if (hasNeedsData) {
        stage3NeedsAssessed.push(customer);
      }

      if (hasProposalData) {
        stage4Proposal.push(customer);
      }

      if (hasClosureData) {
        stage5Closure.push(customer);
      }
    }

    const calculateStageMetrics = (
      stageCustomers: CustomerWithRelations[],
      previousStageCustomers: CustomerWithRelations[]
    ) => {
      const total = stageCustomers.length;
      const closed = stageCustomers.filter((c) => c.closed).length;
      const stageConversionRate = total > 0
        ? (closed / total) * 100
        : 0;
      const dropOffRate = previousStageCustomers.length > 0
        ? ((previousStageCustomers.length - total) / previousStageCustomers.length) * 100
        : 0;

      return {
        total,
        closed,
        conversionRate: Math.round(stageConversionRate * 10) / 10,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
      };
    };

    const stage1Metrics = calculateStageMetrics(stage1Leads, []);
    const stage2Metrics = calculateStageMetrics(stage2Qualified, stage1Leads);
    const stage3Metrics = calculateStageMetrics(stage3NeedsAssessed, stage2Qualified);
    const stage4Metrics = calculateStageMetrics(stage4Proposal, stage3NeedsAssessed);
    const stage5Metrics = calculateStageMetrics(stage5Closure, stage4Proposal);

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
        conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }> = {};
    const byJTBD: Record<string, { total: number; closed: number; conversionRate: number }> = {};
    const byIndustry: Record<string, { total: number; closed: number; conversionRate: number }> = {};

    for (const customer of stage1Leads) {
      const extraction = this.getExtraction(customer);
      const leadSource = extraction?.leadSource || UNKNOWN_VALUE;
      if (!byLeadSource[leadSource]) {
        byLeadSource[leadSource] = { total: 0, closed: 0, conversionRate: 0 };
      }
      byLeadSource[leadSource].total++;
      if (customer.closed) {
        byLeadSource[leadSource].closed++;
      }

      if (extraction?.jtbdPrimary && extraction.jtbdPrimary.length > 0) {
        for (const jtbd of extraction.jtbdPrimary) {
          if (!byJTBD[jtbd]) {
            byJTBD[jtbd] = { total: 0, closed: 0, conversionRate: 0 };
          }
          byJTBD[jtbd].total++;
          if (customer.closed) {
            byJTBD[jtbd].closed++;
          }
        }
      }

      if (extraction?.industry) {
        if (!byIndustry[extraction.industry]) {
          byIndustry[extraction.industry] = { total: 0, closed: 0, conversionRate: 0 };
        }
        byIndustry[extraction.industry].total++;
        if (customer.closed) {
          byIndustry[extraction.industry].closed++;
        }
      }
    }

    for (const key in byLeadSource) {
      byLeadSource[key].conversionRate = byLeadSource[key].total > 0
        ? (byLeadSource[key].closed / byLeadSource[key].total) * 100
        : 0;
    }

    for (const key in byJTBD) {
      byJTBD[key].conversionRate = byJTBD[key].total > 0
        ? (byJTBD[key].closed / byJTBD[key].total) * 100
        : 0;
    }

    for (const key in byIndustry) {
      byIndustry[key].conversionRate = byIndustry[key].total > 0
        ? (byIndustry[key].closed / byIndustry[key].total) * 100
        : 0;
    }

    const topPerformers = Object.entries(byLeadSource)
      .map(([source, stats]) => ({ source, conversionRate: stats.conversionRate }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 3)
      .map((item) => item.source);

    const breakdown = {
      byLeadSource,
      byJTBD,
      byIndustry,
    };

    const urgencyStats: Record<string, { total: number; closed: number }> = {};
    const sentimentStats: Record<string, { total: number; closed: number }> = {};
    const urgencySentimentMatrix: Record<string, Record<string, { total: number; closed: number }>> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const urgency = extraction.urgency || "MEDIA";
      const sentiment = extraction.sentiment || "NEUTRAL";

      if (!urgencyStats[urgency]) {
        urgencyStats[urgency] = { total: 0, closed: 0 };
      }
      urgencyStats[urgency].total++;
      if (customer.closed) {
        urgencyStats[urgency].closed++;
      }

      if (!sentimentStats[sentiment]) {
        sentimentStats[sentiment] = { total: 0, closed: 0 };
      }
      sentimentStats[sentiment].total++;
      if (customer.closed) {
        sentimentStats[sentiment].closed++;
      }

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

    const byUrgency: Record<string, { total: number; closed: number; conversionRate: number }> = {};
    for (const [urgency, stats] of Object.entries(urgencyStats)) {
      byUrgency[urgency] = {
        ...stats,
        conversionRate: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100 * 10) / 10 : 0,
      };
    }

    const bySentiment: Record<string, { total: number; closed: number; conversionRate: number }> = {};
    for (const [sentiment, stats] of Object.entries(sentimentStats)) {
      bySentiment[sentiment] = {
        ...stats,
        conversionRate: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100 * 10) / 10 : 0,
      };
    }

    const matrix = Object.entries(urgencySentimentMatrix).flatMap(([urgency, sentiments]) =>
      Object.entries(sentiments).map(([sentiment, stats]) => ({
        urgency,
        sentiment,
        total: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100 * 10) / 10 : 0,
      }))
    );

    const insightsData = {
      stages: [
        {
          name: "Lead Generation",
          total: stage1Metrics.total,
          closed: stage1Metrics.closed,
          conversionRate: stage1Metrics.conversionRate,
          dropOffRate: stage1Metrics.dropOffRate,
        },
        {
          name: "Qualification",
          total: stage2Metrics.total,
          closed: stage2Metrics.closed,
          conversionRate: stage2Metrics.conversionRate,
          dropOffRate: stage2Metrics.dropOffRate,
        },
        {
          name: "Needs Assessment",
          total: stage3Metrics.total,
          closed: stage3Metrics.closed,
          conversionRate: stage3Metrics.conversionRate,
          dropOffRate: stage3Metrics.dropOffRate,
        },
        {
          name: "Proposal Development",
          total: stage4Metrics.total,
          closed: stage4Metrics.closed,
          conversionRate: stage4Metrics.conversionRate,
          dropOffRate: stage4Metrics.dropOffRate,
        },
        {
          name: "Closure",
          total: stage5Metrics.total,
          closed: stage5Metrics.closed,
          conversionRate: stage5Metrics.conversionRate,
          dropOffRate: stage5Metrics.dropOffRate,
        },
      ],
      breakdown,
      topPerformers,
      trends: {
        conversionTrend,
      },
      urgencySentiment: {
        byUrgency,
        bySentiment,
        matrix,
      },
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
}
