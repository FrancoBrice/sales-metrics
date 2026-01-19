import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Extraction, LeadSource, Industry, PainPoints, BusinessModel, VolumeUnit, Sentiment, Urgency, RiskLevel } from "@vambe/shared";
import { mapExtractionDataToExtraction } from "../extract/llm";

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
              include: { data: true },
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
    const painPointStats: Record<string, { total: number; closed: number }> = {};
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

  async getLeadsOverTime(filter: MetricsFilter) {
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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { meetingDate: "asc" },
    });

    const timeSeriesMap = new Map<string, { total: number; bySource: Record<string, number> }>();

    for (const customer of customers) {
      const date = new Date(customer.meetingDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { total: 0, bySource: {} });
      }

      const entry = timeSeriesMap.get(key)!;
      entry.total++;

      const extraction = this.getExtraction(customer);
      const source = extraction?.leadSource || "Desconocido";

      entry.bySource[source] = (entry.bySource[source] || 0) + 1;
    }

    // Convert map to sorted array
    const leadsOverTime = Array.from(timeSeriesMap.entries())
      .map(([period, data]) => ({
        period,
        total: data.total,
        bySource: data.bySource,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { leadsOverTime };
  }

  async getSankeyData() {
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

    const nodesMap = new Map<string, number>();
    const nodes: { name: string; category: string }[] = [];
    const linksMap = new Map<string, number>();

    const getNodeIndex = (name: string, category: string) => {
      const key = `${category}:${name}`;
      if (!nodesMap.has(key)) {
        nodesMap.set(key, nodes.length);
        nodes.push({ name, category });
      }
      return nodesMap.get(key)!;
    };

    const addLink = (source: number, target: number, value: number) => {
      const key = `${source}-${target}`;
      linksMap.set(key, (linksMap.get(key) || 0) + value);
    };

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const source = extraction.leadSource || "Desconocido";
      const painPoints = extraction.painPoints?.length ? extraction.painPoints : ["Ninguno"];
      const sentiment = extraction.sentiment || "NEUTRAL";
      const status = customer.closed ? "Cerrada" : "Perdida";

      const weight = 1 / painPoints.length;

      const sourceIdx = getNodeIndex(source, "source");
      const sentimentIdx = getNodeIndex(sentiment, "sentiment");
      const statusIdx = getNodeIndex(status, "status");

      for (const painPoint of painPoints) {
        const painPointIdx = getNodeIndex(painPoint, "painPoint");

        // Source -> Pain Point
        addLink(sourceIdx, painPointIdx, weight);

        // Pain Point -> Sentiment
        addLink(painPointIdx, sentimentIdx, weight);
      }

      // Sentiment -> Status
      // We add the full weight (1) here, but since we split the previous flows,
      // the incoming flow to Sentiment for this customer sums to 1.
      addLink(sentimentIdx, statusIdx, 1);
    }

    const links = Array.from(linksMap.entries()).map(([key, value]) => {
      const [source, target] = key.split("-").map(Number);
      return { source, target, value };
    });

    return { nodes, links };
  }

  async getIndustryPainPointHeatmap(filter: MetricsFilter) {
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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

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
        const key = "SIN_PAIN_POINTS";
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
        const conversionRate = data.total > 0 ? (data.closed / data.total) * 100 : 0;
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

  async getOpportunityMatrix(filter: MetricsFilter) {
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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

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
        const key = "SIN_PAIN_POINTS";
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

  async getWinProbabilityMatrix(filter: MetricsFilter) {
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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

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
        const conversionRate = data.total > 0 ? (data.closed / data.total) * 100 : 0;

        const riskBreakdown = riskOrder.map((risk) => {
          const riskData = data.byRisk[risk];
          const riskConversionRate = riskData.total > 0 ? (riskData.closed / riskData.total) * 100 : 0;
          return {
            riskLevel: risk,
            total: riskData.total,
            closed: riskData.closed,
            conversionRate: Math.round(riskConversionRate * 10) / 10,
          };
        });

        const weightedProbability =
          riskOrder.reduce((sum, risk, index) => {
            const riskWeight = 1 - index * 0.2;
            const riskData = data.byRisk[risk];
            const riskRate = riskData.total > 0 ? (riskData.closed / riskData.total) * 100 : 0;
            return sum + riskRate * riskWeight * (riskData.total / Math.max(data.total, 1));
          }, 0) * 100;

        return {
          urgency,
          sentiment,
          total: data.total,
          closed: data.closed,
          conversionRate: Math.round(conversionRate * 10) / 10,
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
      const conversionRate = urgencyData.total > 0 ? (urgencyData.closed / urgencyData.total) * 100 : 0;
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
      const conversionRate = sentimentData.total > 0 ? (sentimentData.closed / sentimentData.total) * 100 : 0;
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

  async getVolumeFlowSankeyData() {
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

    const nodesMap = new Map<string, number>();
    const nodes: { name: string; category: string }[] = [];
    const linksMap = new Map<string, number>();

    const getNodeIndex = (name: string, category: string) => {
      const key = `${category}:${name}`;
      if (!nodesMap.has(key)) {
        nodesMap.set(key, nodes.length);
        nodes.push({ name, category });
      }
      return nodesMap.get(key)!;
    };

    const addLink = (source: number, target: number, value: number) => {
      const key = `${source}-${target}`;
      linksMap.set(key, (linksMap.get(key) || 0) + value);
    };

    for (const customer of customers) {
      const extraction = this.getExtraction(customer);
      if (!extraction) continue;

      const businessModel = extraction.businessModel || "Desconocido";
      const volumeUnit = extraction.volume?.unit || "Sin Volumen";
      const volumeIsPeak = extraction.volume?.isPeak ? "Con Peaks" : "Sin Peaks";
      const status = customer.closed ? "Cerrada" : "Perdida";

      const businessModelIdx = getNodeIndex(businessModel, "businessModel");
      const volumeUnitIdx = getNodeIndex(volumeUnit, "volumeUnit");
      const volumeIsPeakIdx = getNodeIndex(volumeIsPeak, "volumeIsPeak");
      const statusIdx = getNodeIndex(status, "status");

      addLink(businessModelIdx, volumeUnitIdx, 1);
      addLink(volumeUnitIdx, volumeIsPeakIdx, 1);
      addLink(volumeIsPeakIdx, statusIdx, 1);
    }

    const links = Array.from(linksMap.entries()).map(([key, value]) => {
      const [source, target] = key.split("-").map(Number);
      return { source, target, value };
    });

    return { nodes, links };
  }

  async getSellerDetails(seller: string, filter: MetricsFilter) {
    const where: Prisma.CustomerWhereInput = {
      seller,
    };

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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

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

  async getSellersMetrics(filter: MetricsFilter) {
    const where: Prisma.CustomerWhereInput = {};

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
              include: { data: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

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

  private getExtraction(customer: any): Extraction | null {
    const meeting = customer.meetings[0];
    const extractionRecord = meeting?.extractions[0];
    if (!extractionRecord) return null;

    return mapExtractionDataToExtraction(extractionRecord.data);
  }
}
