import React from "react";

interface SankeyLinkProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  sourceColor: string;
}

export function SankeyLink({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  sourceColor,
}: SankeyLinkProps) {
  // Recharts passes the center Y coordinate, but we need the top Y coordinate for the path
  const sourceTop = sourceY - linkWidth / 2;
  const targetTop = targetY - linkWidth / 2;

  return (
    <path
      d={`
        M${sourceX},${sourceTop}
        C${sourceControlX},${sourceTop} ${targetControlX},${targetTop} ${targetX},${targetTop}
        L${targetX},${targetTop + linkWidth}
        C${targetControlX},${targetTop + linkWidth} ${sourceControlX},${sourceTop + linkWidth} ${sourceX},${sourceTop + linkWidth}
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
      className="sankey-link"
    />
  );
}
