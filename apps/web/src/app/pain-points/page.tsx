"use client";

import { useState } from "react";
import { PainPointsBubbleChart } from "@/components/charts/PainPointsBubbleChart";
import { JobsToBeDoneBubbleChart } from "@/components/charts/JobsToBeDoneBubbleChart";

type ChartType = "pain-points" | "jobs-to-be-done";

export default function PainPointsPage() {
  const [chartType, setChartType] = useState<ChartType>("pain-points");

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Análisis de Pain Points y Jobs to be Done</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualización de impacto y conversión por punto de dolor y jobs to be done.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setChartType("pain-points")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: chartType === "pain-points" ? "var(--color-primary)" : "var(--color-surface)",
              color: chartType === "pain-points" ? "white" : "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Pain Points
          </button>
          <button
            onClick={() => setChartType("jobs-to-be-done")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: chartType === "jobs-to-be-done" ? "var(--color-primary)" : "var(--color-surface)",
              color: chartType === "jobs-to-be-done" ? "white" : "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            Jobs to be Done
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {chartType === "pain-points" ? <PainPointsBubbleChart /> : <JobsToBeDoneBubbleChart />}
      </div>
    </div>
  );
}
