"use strict";
import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { api } from "@/lib/api";
import { LeadSourceLabels, PainPointsLabels, LeadSource, PainPoints } from "@vambe/shared";
import { sankeyColorList } from "@/constants/colors";
import { SankeyNode, SankeyLink, SankeyHiddenNodes, useSankeyData } from "./shared";

interface SankeyData {
  nodes: { name: string; category: string }[];
  links: { source: number; target: number; value: number }[];
}

export function SankeyChart() {
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.metrics.sankey()
      .then(setData)
      .catch((err) => console.error("Failed to load sankey data", err))
      .finally(() => setLoading(false));
  }, []);

  const processedDataResult = useSankeyData({
    data,
    hiddenNodes,
    firstCategory: "source",
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
  if (!data || !processedData || processedData.nodes.length === 0) return null;

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
    return (
      LeadSourceLabels[name as LeadSource] ||
      PainPointsLabels[name as PainPoints] ||
      name
    );
  };

  const nodesWithColors = processedData.nodes.map((node, i) => {
    if (node.name === "Cerrada") return { ...node, color: "#22c55e" };
    if (node.name === "Perdida") return { ...node, color: "#ef4444" };
    if (node.name === "Positivo") return { ...node, color: "#22c55e" };
    if (node.name === "Negativo") return { ...node, color: "#ef4444" };
    if (node.name === "Neutro" || node.name === "Neutro/Desconocido") return { ...node, color: "#eab308" };
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
        <div className="sankey-column">Fuente</div>
        <div className="sankey-column center">Pain Point</div>
        <div className="sankey-column center">Sentimiento</div>
        <div className="sankey-column right">Estado</div>
      </div>

      <div className="sankey-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={processedData}
            node={CustomSankeyNode}
            link={CustomSankeyLink}
            nodePadding={20}
            nodeWidth={20}
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
                  <div className="sankey-tooltip">
                    <div className="sankey-tooltip-title">
                      Flujo
                    </div>
                    <div className="sankey-tooltip-value">
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
