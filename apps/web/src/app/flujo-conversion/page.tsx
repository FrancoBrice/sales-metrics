"use client";

import { SankeyChart } from "@/components/charts/SankeyChart";

export default function FlujoConversionPage() {
  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Flujo de Conversión</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualización del recorrido de los leads desde la fuente hasta el cierre.
          </p>
        </div>
      </div>
      <SankeyChart />
    </div>
  );
}