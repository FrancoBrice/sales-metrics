import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Extraction, LeadSource, Industry, PainPoints } from "@vambe/shared";

interface MetricsFilter {
  seller?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) { }

  async getOverview(filter: MetricsFilter) {
    const where: Prisma.CustomerWhereInput = {};

    if (filter.seller) {
      where.seller = filter.seller;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.meetingDate = {};
      if (filter.dateFrom) {
        where.meetingDate.gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        where.meetingDate.lte = new Date(filter.dateTo);
      }
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        meetings: {
          include: {
            extractions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const totalCustomers = customers.length;
    const closedDeals = customers.filter((c) => c.closed).length;
    const conversionRate = totalCustomers > 0 ? (closedDeals / totalCustomers) * 100 : 0;

    const leadSourceCounts: Record<string, number> = {};
    const painPointCounts: Record<string, number> = {};
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
          painPointCounts[painPoint] = (painPointCounts[painPoint] || 0) + 1;
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

    const topPainPoints = Object.entries(painPointCounts)
      .map(([painPoint, count]) => ({ painPoint: painPoint as PainPoints, count }))
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
      bySeller,
    };
  }

  async getByDimension(dimension: string) {
    const customers = await this.prisma.customer.findMany({
      include: {
        meetings: {
          include: {
            extractions: {
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
          conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getConversionFunnel() {
    const customers = await this.prisma.customer.findMany({
      include: {
        meetings: {
          include: {
            extractions: {
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
        { name: "Cerrados", count: closed, percentage: Math.round((closed / total) * 100) },
      ],
    };
  }

  async getVolumeDistribution() {
    const customers = await this.prisma.customer.findMany({
      include: {
        meetings: {
          include: {
            extractions: {
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

  private getExtraction(customer: { meetings: { extractions: { resultJson: string }[] }[] }): Extraction | null {
    const meeting = customer.meetings[0];
    const extractionRecord = meeting?.extractions[0];
    if (!extractionRecord) return null;

    try {
      return JSON.parse(extractionRecord.resultJson);
    } catch {
      return null;
    }
  }
}
