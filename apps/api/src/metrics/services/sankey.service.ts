import { Injectable } from "@nestjs/common";
import { BaseMetricsService } from "./base-metrics.service";
import { UNKNOWN_VALUE, NO_PAIN_POINTS } from "../../common/constants";

@Injectable()
export class SankeyService extends BaseMetricsService {
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

      const source = extraction.leadSource || UNKNOWN_VALUE;
      const painPoints = extraction.painPoints?.length ? extraction.painPoints : [NO_PAIN_POINTS];
      const sentiment = extraction.sentiment || "NEUTRAL";
      const status = customer.closed ? "Cerrada" : "Perdida";

      const painPointWeight = 1 / painPoints.length;

      const sourceIdx = getNodeIndex(source, "source");
      const sentimentIdx = getNodeIndex(sentiment, "sentiment");
      const statusIdx = getNodeIndex(status, "status");

      for (const painPoint of painPoints) {
        const painPointIdx = getNodeIndex(painPoint, "painPoint");
        addLink(sourceIdx, painPointIdx, painPointWeight);
        addLink(painPointIdx, sentimentIdx, painPointWeight);
      }

      addLink(sentimentIdx, statusIdx, 1);
    }

    const links = Array.from(linksMap.entries()).map(([key, value]) => {
      const [source, target] = key.split("-").map(Number);
      return { source, target, value };
    });

    return { nodes, links };
  }
}
