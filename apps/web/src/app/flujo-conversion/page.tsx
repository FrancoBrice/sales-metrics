"use client";

import { SankeyChart } from "@/components/SankeyChart";

export default function FlujoConversionPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <div className="header" style={{ marginBottom: "2rem" }}>
        <h1 className="title">Flujo de Conversión</h1>
        <p className="subtitle">Visualización del recorrido de los leads desde la fuente hasta el cierre.</p>
      </div>
      <SankeyChart />
    </div>
  );
}