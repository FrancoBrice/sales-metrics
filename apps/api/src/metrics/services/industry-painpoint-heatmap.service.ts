import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { calculateConversionRateRounded } from "../../common/helpers/metrics.helper";
import { NO_PAIN_POINTS } from "../../common/constants";

@Injectable()
export class IndustryPainPointHeatmapService extends BaseMetricsService {
  async getIndustryPainPointHeatmap(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const heatmapData: Record<string, Record<string, { total: number; closed: number; volume: number }>> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction || !extraction.industry) continue;

      const industry = extraction.industry;
      const painPoints = extraction.painPoints || [];
      const volume = extraction.volume?.quantity || 0;

      if (!heatmapData[industry]) {
        heatmapData[industry] = {};
      }

      if (painPoints.length === 0) {
        const key = NO_PAIN_POINTS;
        if (!heatmapData[industry][key]) {
          heatmapData[industry][key] = { total: 0, closed: 0, volume: 0 };
        }
        heatmapData[industry][key].total++;
        heatmapData[industry][key].volume += volume;
        if (customer.closed) {
          heatmapData[industry][key].closed++;
        }
      } else {
        for (const painPoint of painPoints) {
          if (!heatmapData[industry][painPoint]) {
            heatmapData[industry][painPoint] = { total: 0, closed: 0, volume: 0 };
          }
          heatmapData[industry][painPoint].total++;
          heatmapData[industry][painPoint].volume += volume;
          if (customer.closed) {
            heatmapData[industry][painPoint].closed++;
          }
        }
      }
    }

    const industries = Object.keys(heatmapData).sort();
    const painPoints = new Set<string>();
    Object.values(heatmapData).forEach((ppMap) => {
      Object.keys(ppMap).forEach((pp) => painPoints.add(pp));
    });
    const painPointsArray = Array.from(painPoints).sort();

    const cells = industries.flatMap((industry) =>
      painPointsArray.map((painPoint) => {
        const data = heatmapData[industry][painPoint] || { total: 0, closed: 0, volume: 0 };
        const conversionRate = calculateConversionRateRounded(data.total, data.closed);
        const avgVolume = data.total > 0 ? data.volume / data.total : 0;

        return {
          industry,
          painPoint,
          total: data.total,
          closed: data.closed,
          conversionRate: Math.round(conversionRate * 10) / 10,
          avgVolume: Math.round(avgVolume),
        };
      })
    );

    return {
      industries,
      painPoints: painPointsArray,
      cells,
    };
  }
}
