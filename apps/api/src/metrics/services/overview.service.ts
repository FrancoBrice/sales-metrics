import { Injectable } from "@nestjs/common";
import { LeadSource, PainPoints, JtbdPrimary } from "@vambe/shared";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";

@Injectable()
export class OverviewService extends BaseMetricsService {
  async getOverview(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const totalCustomers = customers.length;
    const closedDeals = customers.filter((c) => c.closed).length;
    const conversionRate = totalCustomers > 0 ? (closedDeals / totalCustomers) * 100 : 0;

    const leadSourceCounts: Record<string, number> = {};
    const painPointStats: Record<string, { total: number; closed: number }> = {};
    const jtbdStats: Record<string, { total: number; closed: number }> = {};
    const volumes: number[] = [];
    const sellerStats: Record<string, { total: number; closed: number }> = {};

    for (const customer of customers) {
      if (!sellerStats[customer.seller]) {
        sellerStats[customer.seller] = { total: 0, closed: 0 };
      }
      sellerStats[customer.seller].total++;
      if (customer.closed) {
        sellerStats[customer.seller].closed++;
      }

      const extraction = this.getExtraction(customer);
      if (extraction) {
        if (extraction.leadSource) {
          leadSourceCounts[extraction.leadSource] = (leadSourceCounts[extraction.leadSource] || 0) + 1;
        }

        for (const painPoint of extraction.painPoints || []) {
          if (!painPointStats[painPoint]) {
            painPointStats[painPoint] = { total: 0, closed: 0 };
          }
          painPointStats[painPoint].total++;
          if (customer.closed) {
            painPointStats[painPoint].closed++;
          }
        }

        for (const jtbd of extraction.jtbdPrimary || []) {
          if (!jtbdStats[jtbd]) {
            jtbdStats[jtbd] = { total: 0, closed: 0 };
          }
          jtbdStats[jtbd].total++;
          if (customer.closed) {
            jtbdStats[jtbd].closed++;
          }
        }

        if (extraction.volume?.quantity) {
          volumes.push(extraction.volume.quantity);
        }
      }
    }

    const topLeadSources = Object.entries(leadSourceCounts)
      .map(([source, count]) => ({ source: source as LeadSource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topPainPoints = Object.entries(painPointStats)
      .map(([painPoint, stats]) => ({
        painPoint: painPoint as PainPoints,
        count: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topJobsToBeDone = Object.entries(jtbdStats)
      .map(([jtbd, stats]) => ({
        jtbd: jtbd as JtbdPrimary,
        count: stats.total,
        closed: stats.closed,
        conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null;

    const bySeller = Object.entries(sellerStats).map(([seller, stats]) => ({
      seller,
      total: stats.total,
      closed: stats.closed,
      conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
    }));

    return {
      totalCustomers,
      closedDeals,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgVolume: avgVolume ? Math.round(avgVolume) : null,
      topLeadSources,
      topPainPoints,
      topJobsToBeDone,
      bySeller,
    };
  }
}
