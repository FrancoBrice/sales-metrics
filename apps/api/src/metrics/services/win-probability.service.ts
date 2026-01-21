import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { calculateConversionRate, calculateConversionRateRounded } from "../../common/helpers/metrics.helper";

@Injectable()
export class WinProbabilityService extends BaseMetricsService {
  async getWinProbabilityMatrix(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const urgencyOrder = ["BAJA", "MEDIA", "ALTA", "INMEDIATA"];
    const sentimentOrder = ["ESCEPTICO", "NEUTRAL", "POSITIVO"];
    const riskOrder = ["ALTO", "MEDIO", "BAJO"];

    const matrix: Record<string, Record<string, { total: number; closed: number; byRisk: Record<string, { total: number; closed: number }> }>> = {};

    for (const urgency of urgencyOrder) {
      matrix[urgency] = {};
      for (const sentiment of sentimentOrder) {
        matrix[urgency][sentiment] = {
          total: 0,
          closed: 0,
          byRisk: {},
        };
        for (const risk of riskOrder) {
          matrix[urgency][sentiment].byRisk[risk] = { total: 0, closed: 0 };
        }
      }
    }

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const urgency = extraction.urgency || "MEDIA";
      const sentiment = extraction.sentiment || "NEUTRAL";
      const riskLevel = extraction.riskLevel || "MEDIO";

      if (matrix[urgency] && matrix[urgency][sentiment]) {
        matrix[urgency][sentiment].total++;
        if (customer.closed) {
          matrix[urgency][sentiment].closed++;
        }

        if (matrix[urgency][sentiment].byRisk[riskLevel]) {
          matrix[urgency][sentiment].byRisk[riskLevel].total++;
          if (customer.closed) {
            matrix[urgency][sentiment].byRisk[riskLevel].closed++;
          }
        }
      }
    }

    const cells = urgencyOrder.flatMap((urgency) =>
      sentimentOrder.map((sentiment) => {
        const data = matrix[urgency][sentiment];
        const conversionRate = calculateConversionRateRounded(data.total, data.closed);

        const riskBreakdown = riskOrder.map((risk) => {
          const riskData = data.byRisk[risk];
          const riskConversionRate = calculateConversionRateRounded(riskData.total, riskData.closed);
          return {
            riskLevel: risk,
            total: riskData.total,
            closed: riskData.closed,
            conversionRate: riskConversionRate,
          };
        });

        const weightedProbability =
          riskOrder.reduce((sum, risk, index) => {
            const riskWeight = 1 - index * 0.2;
            const riskData = data.byRisk[risk];
            const riskRate = calculateConversionRate(riskData.total, riskData.closed);
            return sum + riskRate * riskWeight * (riskData.total / Math.max(data.total, 1));
          }, 0) * 100;

        return {
          urgency,
          sentiment,
          total: data.total,
          closed: data.closed,
          conversionRate,
          winProbability: Math.min(100, Math.max(0, Math.round(weightedProbability * 10) / 10)),
          riskBreakdown,
        };
      })
    );

    const urgencyStats = urgencyOrder.map((urgency) => {
      const urgencyData = Object.values(matrix[urgency] || {}).reduce(
        (acc, data) => ({
          total: acc.total + data.total,
          closed: acc.closed + data.closed,
        }),
        { total: 0, closed: 0 }
      );
      const conversionRate = calculateConversionRateRounded(urgencyData.total, urgencyData.closed);
      return {
        urgency,
        total: urgencyData.total,
        closed: urgencyData.closed,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    const sentimentStats = sentimentOrder.map((sentiment) => {
      const sentimentData = urgencyOrder.reduce(
        (acc, urgency) => {
          const data = matrix[urgency]?.[sentiment] || { total: 0, closed: 0 };
          return {
            total: acc.total + data.total,
            closed: acc.closed + data.closed,
          };
        },
        { total: 0, closed: 0 }
      );
      const conversionRate = calculateConversionRateRounded(sentimentData.total, sentimentData.closed);
      return {
        sentiment,
        total: sentimentData.total,
        closed: sentimentData.closed,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    return {
      matrix: cells,
      urgencyStats,
      sentimentStats,
    };
  }
}
