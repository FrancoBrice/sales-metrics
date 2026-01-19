"use strict";

import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { api } from "@/lib/api";
import {
  BusinessModelLabels,
  VolumeUnitLabels,
  BusinessModel,
  VolumeUnit,
} from "@vambe/shared";
import { sankeyColorList } from "@/constants/colors";
import { SankeyNode, SankeyLink, SankeyHiddenNodes, useSankeyData } from "./shared";
import { EmptyState } from "@/components/ui/Loading";

interface SankeyData {
  nodes: { name: string; category: string }[];
  links: { source: number; target: number; value: number }[];
}

export function VolumeSankeyChart() {
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.metrics.volumeFlow()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const processedDataResult = useSankeyData({
    data,
    hiddenNodes,
    firstCategory: "businessModel",
  });

  const processedData = processedDataResult
    ? { nodes: processedDataResult.nodes, links: processedDataResult.links }
    : null;

  const autoHiddenNodes = processedDataResult?.autoHiddenNodes || new Set<string>();

  const totalValue = useMemo(() => {
    if (!processedData) return 0;
    return processedData.links.reduce((sum, link) => sum + link.value, 0);
  }, [processedData]);

  if (loading) return <div className="card loading-placeholder">Cargando diagrama...</div>;
  if (!data || !processedData || processedData.nodes.length === 0) return (
    <div className="card">
      <EmptyState
        title="No hay datos de volumen"
        message="Aún no hay datos disponibles para mostrar el análisis de volumen"
      />
    </div>
  );

  const toggleNode = (nodeName: string) => {
    const next = new Set(hiddenNodes);
    if (next.has(nodeName)) {
      next.delete(nodeName);
    } else {
      next.add(nodeName);
    }
    setHiddenNodes(next);
  };

  const getLabel = (name: string): string => {
    if (name === "Cerrada") return "Cerrada";
    if (name === "Perdida") return "Perdida";
    if (name === "Con Peaks") return "Con Peaks";
    if (name === "Sin Peaks") return "Sin Peaks";
    if (name === "Sin Volumen") return "Sin Volumen";
    if (name === "Desconocido") return "Desconocido";

    if (BusinessModelLabels[name as BusinessModel]) {
      return BusinessModelLabels[name as BusinessModel];
    }
    if (VolumeUnitLabels[name as VolumeUnit]) {
      return VolumeUnitLabels[name as VolumeUnit];
    }

    return name;
  };

  const nodesWithColors = processedData.nodes.map((node, i) => {
    if (node.name === "Cerrada") return { ...node, color: "#22c55e" };
    if (node.name === "Perdida") return { ...node, color: "#ef4444" };
    if (node.name === "Con Peaks") return { ...node, color: "#f59e0b" };
    if (node.name === "Sin Peaks") return { ...node, color: "#6b7280" };
    if (node.name === "Sin Volumen") return { ...node, color: "#9ca3af" };

    if (node.category === "businessModel") {
      const colors: Record<string, string> = {
        [BusinessModel.B2B]: "#3b82f6",
        [BusinessModel.B2C]: "#ec4899",
        [BusinessModel.B2B2C]: "#8b5cf6",
        [BusinessModel.MARKETPLACE]: "#10b981",
      };
      return { ...node, color: colors[node.name] || sankeyColorList[i % sankeyColorList.length] };
    }

    if (node.category === "volumeUnit") {
      const colors: Record<string, string> = {
        [VolumeUnit.DIARIO]: "#06b6d4",
        [VolumeUnit.SEMANAL]: "#6366f1",
        [VolumeUnit.MENSUAL]: "#f97316",
      };
      return { ...node, color: colors[node.name] || sankeyColorList[i % sankeyColorList.length] };
    }

    return { ...node, color: sankeyColorList[i % sankeyColorList.length] };
  });

  const CustomSankeyLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
    const sourceNode = nodesWithColors[payload.source.index];
    const sourceColor = sourceNode ? sourceNode.color : "#ccc";

    return (
      <SankeyLink
        sourceX={sourceX}
        sourceY={sourceY}
        targetX={targetX}
        targetY={targetY}
        sourceControlX={sourceControlX}
        targetControlX={targetControlX}
        linkWidth={linkWidth}
        sourceColor={sourceColor}
      />
    );
  };

  const CustomSankeyNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const node = nodesWithColors[index];
    const label = getLabel(node.name);

    return (
      <SankeyNode
        x={x}
        y={y}
        width={width}
        height={height}
        index={index}
        containerWidth={containerWidth}
        label={label}
        color={node.color}
        onToggle={toggleNode}
        nodeName={node.name}
      />
    );
  };

  return (
    <div className="card sankey-chart">
      <SankeyHiddenNodes
        hiddenNodes={autoHiddenNodes}
        onToggle={toggleNode}
        onRestoreAll={() => setHiddenNodes(new Set())}
        getLabel={getLabel}
      />

      <div className="sankey-columns">
        <div className="sankey-column">Modelo Negocio</div>
        <div className="sankey-column center">Frecuencia Volumen</div>
        <div className="sankey-column center">Peaks</div>
        <div className="sankey-column right">Estado</div>
      </div>

      <div className="sankey-chart-container" style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={processedData}
            node={CustomSankeyNode}
            link={CustomSankeyLink}
            nodePadding={20}
            nodeWidth={20}
            iterations={64}
            linkCurvature={0.5}
            margin={{
              left: 10,
              right: 150,
              top: 10,
              bottom: 10,
            }}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0]?.payload;
                if (!data || typeof data.value !== "number") return null;
                const value = data.value;
                const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
                return (
                  <div
                    style={{
                      backgroundColor: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div style={{ color: "var(--color-text)", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Flujo
                    </div>
                    <div style={{ color: "var(--color-text-muted)" }}>
                      {value.toFixed(1)} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
      <div className="sankey-tip">
        Tip: Haz clic en los nodos para ocultar/filtrar flujos
      </div>
    </div>
  );
}
