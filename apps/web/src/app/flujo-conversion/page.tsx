"use client";

import { useState } from "react";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { VolumeSankeyChart } from "@/components/charts/VolumeSankeyChart";

type SankeyType = "conversion" | "volume";

export default function FlujoConversionPage() {
  const [sankeyType, setSankeyType] = useState<SankeyType>("conversion");

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Flujo de Conversión</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualización del recorrido de los leads desde la fuente hasta el cierre.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setSankeyType("conversion")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: sankeyType === "conversion" ? "var(--color-primary)" : "var(--color-surface)",
              color: sankeyType === "conversion" ? "white" : "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Flujo de Conversión
          </button>
          <button
            onClick={() => setSankeyType("volume")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: sankeyType === "volume" ? "var(--color-primary)" : "var(--color-surface)",
              color: sankeyType === "volume" ? "white" : "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Análisis de Volumen
          </button>
        </div>
      </div>
      {sankeyType === "conversion" ? <SankeyChart /> : <VolumeSankeyChart />}
    </div>
  );
}