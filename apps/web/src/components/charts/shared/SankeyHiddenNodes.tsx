import React from "react";

interface SankeyHiddenNodesProps {
  hiddenNodes: Set<string>;
  onToggle: (nodeName: string) => void;
  onRestoreAll: () => void;
  getLabel: (name: string) => string;
}

export function SankeyHiddenNodes({
  hiddenNodes,
  onToggle,
  onRestoreAll,
  getLabel,
}: SankeyHiddenNodesProps) {
  if (hiddenNodes.size === 0) return null;

  return (
    <div className="sankey-hidden-nodes">
      <div className="sankey-hidden-badges">
        <span className="sankey-hidden-label">Ocultos:</span>
        {Array.from(hiddenNodes).map((name) => (
          <button
            key={name}
            onClick={() => onToggle(name)}
            className="sankey-hidden-node-btn"
          >
            {getLabel(name)}
            <span className="remove-icon">×</span>
          </button>
        ))}
        <button onClick={onRestoreAll} className="sankey-restore-btn">
          Restaurar todo
        </button>
      </div>
    </div>
  );
}
