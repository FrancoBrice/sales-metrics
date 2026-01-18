import React from "react";
import { Rectangle, Layer } from "recharts";

interface SankeyNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  containerWidth: number;
  label: string;
  color: string;
  onToggle?: (nodeName: string) => void;
  nodeName: string;
}

export function SankeyNode({
  x,
  y,
  width,
  height,
  index,
  containerWidth,
  label,
  color,
  onToggle,
  nodeName,
}: SankeyNodeProps) {
  const isOut = x + width + 6 > containerWidth;

  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity="1"
        onClick={() => onToggle?.(nodeName)}
        style={{ cursor: onToggle ? "pointer" : "default" }}
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="12"
        fill="var(--color-text)"
        dy="0.35em"
        style={{
          fontWeight: 500,
          textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          cursor: onToggle ? "pointer" : "default",
          pointerEvents: "none",
        }}
      >
        {label}
      </text>
    </Layer>
  );
}
