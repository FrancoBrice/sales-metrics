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
}
