"use strict";
import React, { useEffect, useState } from "react";
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from "recharts";
import { api } from "@/lib/api";
import { LeadSourceLabels, PainPointsLabels, LeadSource, PainPoints } from "@vambe/shared";
import { sankeyColorList } from "@/constants/colors";

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

  const processedData = React.useMemo(() => {
    if (!data) return null;

    const activeNodes = data.nodes.filter(n => !hiddenNodes.has(n.name));

    const indexMap = new Array(data.nodes.length).fill(-1);
    data.nodes.forEach((node, oldIndex) => {
      if (!hiddenNodes.has(node.name)) {
        const newIndex = activeNodes.findIndex(n => n.name === node.name);
        indexMap[oldIndex] = newIndex;
      }
    });

    const activeLinks = data.links
      .filter(link => {
        const sourceVisible = !hiddenNodes.has(data.nodes[link.source].name);
        const targetVisible = !hiddenNodes.has(data.nodes[link.target].name);
        return sourceVisible && targetVisible;
      })
      .map(link => ({
        ...link,
        source: indexMap[link.source],
        target: indexMap[link.target],
      }));

    return { nodes: activeNodes, links: activeLinks };
  }, [data, hiddenNodes]);

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

  const nodesWithColors = processedData.nodes.map((node, i) => {
    if (node.name === "Cerrada") return { ...node, color: "#22c55e" };
    if (node.name === "Perdida") return { ...node, color: "#ef4444" };
    if (node.name === "Positivo") return { ...node, color: "#22c55e" };
    if (node.name === "Negativo") return { ...node, color: "#ef4444" };
    if (node.name === "Neutro" || node.name === "Neutro/Desconocido") return { ...node, color: "#eab308" };
    return { ...node, color: sankeyColorList[i % sankeyColorList.length] };
  });

  const SankeyLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
    const sourceNode = nodesWithColors[payload.source.index];
    const sourceColor = sourceNode ? sourceNode.color : "#ccc";

    return (
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          L${targetX},${targetY + linkWidth}
          C${targetControlX},${targetY + linkWidth} ${sourceControlX},${sourceY + linkWidth} ${sourceX},${sourceY + linkWidth}
          Z
        `}
        fill={sourceColor}
        fillOpacity="0.4"
        strokeWidth="0"
        onMouseEnter={(e) => {
          e.currentTarget.setAttribute("fill-opacity", "0.8");
        }}
        onMouseLeave={(e) => {
          e.currentTarget.setAttribute("fill-opacity", "0.4");
        }}
        style={{ transition: "fill-opacity 0.2s" }}
      />
    );
  };

  const SankeyNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isOut = x + width + 6 > containerWidth;
    const node = nodesWithColors[index];
    const label = LeadSourceLabels[node.name as LeadSource] || PainPointsLabels[node.name as PainPoints] || node.name;

    return (
      <Layer key={`CustomNode${index}`}>
        <Rectangle
          x={x} y={y}
          width={width} height={height}
          fill={node.color}
          fillOpacity="1"
          onClick={() => toggleNode(node.name)}
          style={{ cursor: "pointer" }}
        />
        <text
          textAnchor={isOut ? 'end' : 'start'}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2}
          fontSize="12"
          fill="var(--color-text)"
          dy="0.35em"
          style={{ fontWeight: 500, textShadow: "0 1px 2px rgba(0,0,0,0.1)", cursor: "pointer", pointerEvents: "none" }}
        >
          {label}
        </text>
      </Layer>
    );
  };

  return (
    <div className="card sankey-chart">
      <div className="sankey-hidden-nodes">
        {hiddenNodes.size > 0 && (
          <div className="sankey-hidden-badges">
            <span className="sankey-hidden-label">Ocultos:</span>
            {Array.from(hiddenNodes).map(name => (
              <button
                key={name}
                onClick={() => toggleNode(name)}
                className="sankey-hidden-node-btn"
              >
                {LeadSourceLabels[name as LeadSource] || PainPointsLabels[name as PainPoints] || name}
                <span className="remove-icon">×</span>
              </button>
            ))}
            <button
              onClick={() => setHiddenNodes(new Set())}
              className="sankey-restore-btn"
            >
              Restaurar todo
            </button>
          </div>
        )}
      </div>

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
            node={SankeyNode}
            link={SankeyLink}
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
              formatter={(value: any) => {
                if (typeof value === "number") {
                  return value.toFixed(1);
                }
                return value;
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
