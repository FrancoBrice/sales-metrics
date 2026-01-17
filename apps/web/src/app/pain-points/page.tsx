import { PainPointsBubbleChart } from "@/components/PainPointsBubbleChart";

export default function PainPointsPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <div className="header" style={{ marginBottom: "2rem" }}>
        <h1 className="title">Análisis de Pain Points</h1>
        <p className="subtitle">Visualización de impacto y conversión por punto de dolor.</p>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <PainPointsBubbleChart />
      </div>
    </div>
  );
}
