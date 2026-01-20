import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { Sentiment, Industry, LeadSource, PainPoints, Urgency, RiskLevel } from "@vambe/shared";
import { BaseMetricsService } from "./base-metrics.service";

@Injectable()
export class SellersService extends BaseMetricsService {
  async getSellersMetrics(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const sellersMap: Record<string, {
      total: number;
      closed: number;
      sentimentStats: Record<string, { total: number; closed: number }>;
    }> = {};

    for (const customer of customers) {
      const seller = customer.seller;
      if (!sellersMap[seller]) {
        sellersMap[seller] = {
          total: 0,
          closed: 0,
          sentimentStats: {
            POSITIVO: { total: 0, closed: 0 },
            NEUTRAL: { total: 0, closed: 0 },
            ESCEPTICO: { total: 0, closed: 0 },
          },
        };
      }

      sellersMap[seller].total++;
      if (customer.closed) {
        sellersMap[seller].closed++;
      }

      const extraction = this.getExtraction(customer);
      if (extraction?.sentiment) {
        const sentiment = extraction.sentiment;
        sellersMap[seller].sentimentStats[sentiment].total++;
        if (customer.closed) {
          sellersMap[seller].sentimentStats[sentiment].closed++;
        }
      }
    }

    const sellers = Object.entries(sellersMap).map(([seller, stats]) => {
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
      const sentimentDistribution = Object.entries(stats.sentimentStats).map(([sentiment, data]) => ({
        sentiment: sentiment as Sentiment,
        total: data.total,
        closed: data.closed,
        conversionRate: data.total > 0 ? (data.closed / data.total) * 100 : 0,
        percentage: stats.total > 0 ? (data.total / stats.total) * 100 : 0,
      }));

      return {
        seller,
        total: stats.total,
        closed: stats.closed,
        conversionRate: Math.round(conversionRate * 10) / 10,
        sentimentDistribution,
      };
    });

    return sellers.sort((a, b) => b.conversionRate - a.conversionRate);
  }

  async getSellerDetails(seller: string, filter: MetricsFilterDto) {
    const customers = await this.getCustomers({ ...filter, seller });

    const total = customers.length;
    const closed = customers.filter((c) => c.closed).length;
    const conversionRate = total > 0 ? (closed / total) * 100 : 0;

    const sentimentStats: Record<string, { total: number; closed: number }> = {
      POSITIVO: { total: 0, closed: 0 },
      NEUTRAL: { total: 0, closed: 0 },
      ESCEPTICO: { total: 0, closed: 0 },
    };

    const industryStats: Record<string, { total: number; closed: number }> = {};
    const leadSourceStats: Record<string, { total: number; closed: number }> = {};
    const painPointStats: Record<string, { total: number; closed: number }> = {};
    const volumes: number[] = [];
    const urgencyStats: Record<string, { total: number; closed: number }> = {};
    const riskLevelStats: Record<string, { total: number; closed: number }> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (extraction) {
        const sentiment = extraction.sentiment || "NEUTRAL";
        sentimentStats[sentiment].total++;
        if (customer.closed) {
          sentimentStats[sentiment].closed++;
        }

        if (extraction.industry) {
          if (!industryStats[extraction.industry]) {
            industryStats[extraction.industry] = { total: 0, closed: 0 };
          }
          industryStats[extraction.industry].total++;
          if (customer.closed) {
            industryStats[extraction.industry].closed++;
          }
        }

        if (extraction.leadSource) {
          if (!leadSourceStats[extraction.leadSource]) {
            leadSourceStats[extraction.leadSource] = { total: 0, closed: 0 };
          }
          leadSourceStats[extraction.leadSource].total++;
          if (customer.closed) {
            leadSourceStats[extraction.leadSource].closed++;
          }
        }

        extraction.painPoints?.forEach((painPoint) => {
          if (!painPointStats[painPoint]) {
            painPointStats[painPoint] = { total: 0, closed: 0 };
          }
          painPointStats[painPoint].total++;
          if (customer.closed) {
            painPointStats[painPoint].closed++;
          }
        });

        if (extraction.urgency) {
          if (!urgencyStats[extraction.urgency]) {
            urgencyStats[extraction.urgency] = { total: 0, closed: 0 };
          }
          urgencyStats[extraction.urgency].total++;
          if (customer.closed) {
            urgencyStats[extraction.urgency].closed++;
          }
        }

        if (extraction.riskLevel) {
          if (!riskLevelStats[extraction.riskLevel]) {
            riskLevelStats[extraction.riskLevel] = { total: 0, closed: 0 };
          }
          riskLevelStats[extraction.riskLevel].total++;
          if (customer.closed) {
            riskLevelStats[extraction.riskLevel].closed++;
          }
        }

        if (extraction.volume?.quantity) {
          volumes.push(extraction.volume.quantity);
        }
      }
    }

    const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null;

    const sentimentDistribution = Object.entries(sentimentStats).map(([sentiment, stats]) => ({
      sentiment: sentiment as Sentiment,
      total: stats.total,
      closed: stats.closed,
      conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
    }));

    const topIndustries = Object.entries(industryStats)
      .map(([industry, stats]) => ({
        industry: industry as Industry,
        total: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topLeadSources = Object.entries(leadSourceStats)
      .map(([source, stats]) => ({
        source: source as LeadSource,
        total: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topPainPoints = Object.entries(painPointStats)
      .map(([painPoint, stats]) => ({
        painPoint: painPoint as PainPoints,
        total: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const urgencyBreakdown = Object.entries(urgencyStats).map(([urgency, stats]) => ({
      urgency: urgency as Urgency,
      total: stats.total,
      closed: stats.closed,
      conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
    }));

    const riskBreakdown = Object.entries(riskLevelStats).map(([risk, stats]) => ({
      riskLevel: risk as RiskLevel,
      total: stats.total,
      closed: stats.closed,
      conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
    }));

    return {
      seller,
      total,
      closed,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgVolume: avgVolume ? Math.round(avgVolume) : null,
      sentimentDistribution,
      topIndustries,
      topLeadSources,
      topPainPoints,
      urgencyBreakdown,
      riskBreakdown,
    };
  }

  private buildDateFilter(params: { dateFrom?: string; dateTo?: string }): any {
    const { buildDateFilter } = require("../../common/helpers/filter.helper");
    return buildDateFilter(params);
  }
}
