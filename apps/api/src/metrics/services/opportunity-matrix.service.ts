import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { NO_PAIN_POINTS } from "../../common/constants";

@Injectable()
export class OpportunityMatrixService extends BaseMetricsService {
  async getOpportunityMatrix(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const industryStats: Record<string, { total: number; closed: number; volumes: number[]; labels: string[] }> = {};
    const painPointStats: Record<string, { total: number; closed: number; volumes: number[]; labels: string[] }> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const volume = extraction.volume?.quantity || 0;

      if (extraction.industry) {
        const industry = extraction.industry;
        if (!industryStats[industry]) {
          industryStats[industry] = { total: 0, closed: 0, volumes: [], labels: [] };
        }
        industryStats[industry].total++;
        industryStats[industry].volumes.push(volume);
        if (customer.closed) {
          industryStats[industry].closed++;
        }
        if (!industryStats[industry].labels.includes(industry)) {
          industryStats[industry].labels.push(industry);
        }
      }

      const painPoints = extraction.painPoints || [];
      if (painPoints.length === 0) {
        const key = NO_PAIN_POINTS;
        if (!painPointStats[key]) {
          painPointStats[key] = { total: 0, closed: 0, volumes: [], labels: [] };
        }
        painPointStats[key].total++;
        painPointStats[key].volumes.push(volume);
        if (customer.closed) {
          painPointStats[key].closed++;
        }
        if (!painPointStats[key].labels.includes(key)) {
          painPointStats[key].labels.push(key);
        }
      } else {
        for (const painPoint of painPoints) {
          if (!painPointStats[painPoint]) {
            painPointStats[painPoint] = { total: 0, closed: 0, volumes: [], labels: [] };
          }
          painPointStats[painPoint].total++;
          painPointStats[painPoint].volumes.push(volume);
          if (customer.closed) {
            painPointStats[painPoint].closed++;
          }
          if (!painPointStats[painPoint].labels.includes(painPoint)) {
            painPointStats[painPoint].labels.push(painPoint);
          }
        }
      }
    }

    const industries = Object.entries(industryStats).map(([industry, stats]) => {
      const avgVolume = stats.volumes.length > 0
        ? stats.volumes.reduce((a, b) => a + b, 0) / stats.volumes.length
        : 0;
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;

      return {
        category: "industry",
        name: industry,
        total: stats.total,
        closed: stats.closed,
        avgVolume: Math.round(avgVolume),
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    const painPoints = Object.entries(painPointStats).map(([painPoint, stats]) => {
      const avgVolume = stats.volumes.length > 0
        ? stats.volumes.reduce((a, b) => a + b, 0) / stats.volumes.length
        : 0;
      const conversionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;

      return {
        category: "painPoint",
        name: painPoint,
        total: stats.total,
        closed: stats.closed,
        avgVolume: Math.round(avgVolume),
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    const allOpportunities = [...industries, ...painPoints];

    const maxVolume = Math.max(...allOpportunities.map((o) => o.avgVolume), 1);
    const maxConversion = Math.max(...allOpportunities.map((o) => o.conversionRate), 1);

    const quadrants = {
      highValue: allOpportunities.filter(
        (o) => o.avgVolume >= maxVolume * 0.5 && o.conversionRate >= maxConversion * 0.5
      ),
      quickWins: allOpportunities.filter(
        (o) => o.avgVolume < maxVolume * 0.5 && o.conversionRate >= maxConversion * 0.5
      ),
      development: allOpportunities.filter(
        (o) => o.avgVolume >= maxVolume * 0.5 && o.conversionRate < maxConversion * 0.5
      ),
      lowPriority: allOpportunities.filter(
        (o) => o.avgVolume < maxVolume * 0.5 && o.conversionRate < maxConversion * 0.5
      ),
    };

    return {
      opportunities: allOpportunities,
      quadrants,
      thresholds: {
        volume: maxVolume * 0.5,
        conversion: maxConversion * 0.5,
      },
    };
  }
}
