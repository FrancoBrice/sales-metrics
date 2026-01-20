import { Injectable } from "@nestjs/common";
import { BaseMetricsService } from "./base-metrics.service";

@Injectable()
export class VolumeDistributionService extends BaseMetricsService {
  async getVolumeDistribution() {
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

    const ranges = [
      { label: "< 50", min: 0, max: 50 },
      { label: "50-100", min: 50, max: 100 },
      { label: "100-200", min: 100, max: 200 },
      { label: "200-500", min: 200, max: 500 },
      { label: "> 500", min: 500, max: Infinity },
    ];

    const distribution = ranges.map((range) => ({
      range: range.label,
      count: 0,
      closedCount: 0,
    }));

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (extraction?.volume?.quantity) {
        const quantity = extraction.volume.quantity;
        for (let i = 0; i < ranges.length; i++) {
          if (quantity >= ranges[i].min && quantity < ranges[i].max) {
            distribution[i].count++;
            if (customer.closed) {
              distribution[i].closedCount++;
            }
            break;
          }
        }
      }
    }

    return { distribution };
  }
}
