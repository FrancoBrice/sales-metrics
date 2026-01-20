import { Injectable } from "@nestjs/common";
import { BaseMetricsService } from "./base-metrics.service";
import { UNKNOWN_VALUE } from "../../common/constants";

@Injectable()
export class VolumeFlowService extends BaseMetricsService {
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

      const businessModel = extraction.businessModel || UNKNOWN_VALUE;
      const volumeUnit = extraction.volume?.unit || UNKNOWN_VALUE;
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
}
