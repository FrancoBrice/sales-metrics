"use strict";
import React, { useEffect, useState } from "react";
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from "recharts";
import { api } from "@/lib/api";
import { LeadSourceLabels, PainPointsLabels, LeadSource, PainPoints } from "@vambe/shared";

interface SankeyData {
  nodes: { name: string; category: string }[];
  links: { source: number; target: number; value: number }[];
}


const COLORS_LIST = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
];

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

    // 1. Filter nodes
    const activeNodes = data.nodes.filter(n => !hiddenNodes.has(n.name));

    // 2. Create index mapping (old index -> new index)
    // Initialize with -1
    const indexMap = new Array(data.nodes.length).fill(-1);
    data.nodes.forEach((node, oldIndex) => {
      if (!hiddenNodes.has(node.name)) {
        // Find the new index of this node in activeNodes
        const newIndex = activeNodes.findIndex(n => n.name === node.name);
        indexMap[oldIndex] = newIndex;
      }
    });

    // 3. Filter and Remap links
    const activeLinks = data.links
      .filter(link => {
        // Keep link only if both source and target are visible
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

  // Toggle visibility
  const toggleNode = (nodeName: string) => {
    const next = new Set(hiddenNodes);
    if (next.has(nodeName)) {
      next.delete(nodeName);
    } else {
      next.add(nodeName);
    }
    setHiddenNodes(next);
  };

  // Assign colors to ACTIVE nodes
  const nodesWithColors = processedData.nodes.map((node, i) => {
    if (node.name === "Cerrada") return { ...node, color: "#22c55e" };
    if (node.name === "Perdida") return { ...node, color: "#ef4444" };
    if (node.name === "Positivo") return { ...node, color: "#22c55e" };
    if (node.name === "Negativo") return { ...node, color: "#ef4444" };
    if (node.name === "Neutro" || node.name === "Neutro/Desconocido") return { ...node, color: "#eab308" };
    return { ...node, color: COLORS_LIST[i % COLORS_LIST.length] };
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
    <div className="card" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1rem", minHeight: "2rem" }}>
        {hiddenNodes.size > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", alignSelf: "center" }}>Ocultos:</span>
            {Array.from(hiddenNodes).map(name => (
              <button
                key={name}
                onClick={() => toggleNode(name)}
                style={{
                  background: "var(--color-surface-elevated)", // using variable if available, or fallback
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--color-text)"
                }}
              >
                {LeadSourceLabels[name as LeadSource] || PainPointsLabels[name as PainPoints] || name}
                <span style={{ fontWeight: "bold" }}>×</span>
              </button>
            ))}
            <button
              onClick={() => setHiddenNodes(new Set())}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontSize: "0.75rem",
                cursor: "pointer",
                textDecoration: "underline",
                marginLeft: "0.5rem"
              }}
            >
              Restaurar todo
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 10, paddingRight: 150, marginBottom: 10, fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
        <div style={{ width: 100 }}>Fuente</div>
        <div style={{ width: 100, textAlign: "center" }}>Pain Point</div>
        <div style={{ width: 100, textAlign: "center" }}>Sentimiento</div>
        <div style={{ width: 100, textAlign: "right" }}>Estado</div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
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
      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        Tip: Haz clic en los nodos para ocultar/filtrar flujos
      </div>
    </div>
  );
}
