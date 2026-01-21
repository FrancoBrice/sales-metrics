import { Injectable } from "@nestjs/common";
import { BaseMetricsService } from "./base-metrics.service";
import { calculateConversionRate } from "../../common/helpers/metrics.helper";

@Injectable()
export class ConversionFunnelService extends BaseMetricsService {
  async getConversionFunnel() {
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

    const total = customers.length;
    const withMeeting = customers.filter((c) => c.meetings.length > 0).length;
    const withExtraction = customers.filter(
      (c) => c.meetings.some((m) => m.extractions.length > 0)
    ).length;
    const closed = customers.filter((c) => c.closed).length;

    return {
      stages: [
        { name: "Leads Totales", count: total, percentage: 100 },
        { name: "Con Reunión", count: withMeeting, percentage: Math.round((withMeeting / total) * 100) },
        { name: "Analizados", count: withExtraction, percentage: Math.round((withExtraction / total) * 100) },
        { name: "Cerrados", count: closed, percentage: Math.round(calculateConversionRate(total, closed)) },
      ],
    };
  }
}
