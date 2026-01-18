import { PainPointsBubbleChart } from "@/components/charts/PainPointsBubbleChart";

export default function PainPointsPage() {
  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Análisis de Pain Points</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualización de impacto y conversión por punto de dolor.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <PainPointsBubbleChart />
      </div>
    </div>
  );
}
