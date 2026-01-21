import { Injectable } from "@nestjs/common";
import { BaseMetricsService } from "./base-metrics.service";
import { calculateConversionRateRounded } from "../../common/helpers/metrics.helper";

@Injectable()
export class ByDimensionService extends BaseMetricsService {
  async getByDimension(dimension: string) {
    const customers = await this.prisma.customer.findMany({
      include: {
        meetings: {
          include: {
            extractions: {
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const stats: Record<string, { total: number; closed: number }> = {};

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      let values: string[] = [];

      if (dimension === "seller") {
        values = [customer.seller];
      } else if (extraction) {
        if (dimension === "leadSource" && extraction.leadSource) {
          values = [extraction.leadSource];
        } else if (dimension === "industry" && extraction.industry) {
          values = [extraction.industry];
        } else if (dimension === "painPoints") {
          values = extraction.painPoints || [];
        }
      }

      for (const value of values) {
        if (!stats[value]) {
          stats[value] = { total: 0, closed: 0 };
        }
        stats[value].total++;
        if (customer.closed) {
          stats[value].closed++;
        }
      }
    }

    return {
      dimension,
      values: Object.entries(stats)
        .map(([value, data]) => ({
          value,
          count: data.total,
          closedCount: data.closed,
          conversionRate: calculateConversionRateRounded(data.total, data.closed),
        }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
