import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { UNKNOWN_VALUE } from "../../common/constants";

@Injectable()
export class LeadsOverTimeService extends BaseMetricsService {
  async getLeadsOverTime(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);

    const timeSeriesMap = new Map<string, { total: number; bySource: Record<string, number> }>();

    for (const customer of customers) {
      const date = new Date(customer.meetingDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { total: 0, bySource: {} });
      }

      const entry = timeSeriesMap.get(key)!;
      entry.total++;

      const extraction = this.getExtraction(customer);
      const source = extraction?.leadSource || UNKNOWN_VALUE;

      entry.bySource[source] = (entry.bySource[source] || 0) + 1;
    }

    const leadsOverTime = Array.from(timeSeriesMap.entries())
      .map(([period, data]) => ({
        period,
        total: data.total,
        bySource: data.bySource,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { leadsOverTime };
  }
}
