"use client";

import { SankeyChart } from "./SankeyChart";
import { MetricsOverview } from "@/lib/api";
import { LeadSourceLabels, PainPointsLabels, LeadSource, PainPoints } from "@vambe/shared";

interface ChartsSectionProps {
  metrics: MetricsOverview | null;
}

export function ChartsSection({ metrics }: ChartsSectionProps) {
  if (!metrics) return null;

  const maxLeadSourceCount = Math.max(...metrics.topLeadSources.map((s) => s.count), 1);
  const maxSellerTotal = Math.max(...metrics.bySeller.map((s) => s.total), 1);

  return (
    <div className="charts-grid">
      <div className="card">
        <h3 className="section-title">Fuentes de Leads</h3>
        <div className="bar-chart">
          {metrics.topLeadSources.map((item) => (
            <div key={item.source} className="bar-item">
              <span className="bar-label">
                {LeadSourceLabels[item.source as LeadSource] || item.source}
              </span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(item.count / maxLeadSourceCount) * 100}%` }}
                />
              </div>
              <span className="bar-value">{item.count}</span>
            </div>
          ))}
          {metrics.topLeadSources.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>
              Sin datos
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Matriz Pain Points x Estado</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Pain Point
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Perdida
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Cerrada
          </div>

          {metrics.topPainPoints.map((item) => {
            const lost = item.count - item.closed;
            // Calculate max value across all cells in the grid for consistent scaling
            const maxVal = Math.max(
              1,
              ...metrics.topPainPoints.flatMap((p) => [p.count - p.closed, p.closed])
            );

            const lostOpacity = Math.max(0.15, lost / maxVal);
            const wonOpacity = Math.max(0.15, item.closed / maxVal);

            return (
              <div key={item.painPoint} style={{ display: "contents" }}>
                <div
                  className="bar-label"
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={PainPointsLabels[item.painPoint as PainPoints] || item.painPoint}
                >
                  {PainPointsLabels[item.painPoint as PainPoints] || item.painPoint}
                </div>
                <div
                  style={{
                    backgroundColor: `rgba(239, 68, 68, ${lostOpacity})`, // red-500
                    color: lostOpacity > 0.5 ? "white" : "var(--color-text)",
                    borderRadius: "6px",
                    padding: "0.375rem",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                  title={`${lost} perdidas`}
                >
                  {lost}
                </div>
                <div
                  style={{
                    backgroundColor: `rgba(34, 197, 94, ${wonOpacity})`, // green-500
                    color: wonOpacity > 0.5 ? "white" : "var(--color-text)",
                    borderRadius: "6px",
                    padding: "0.375rem",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                  title={`${item.closed} cerradas (${item.conversionRate.toFixed(1)}%)`}
                >
                  {item.closed}
                </div>
              </div>
            );
          })}
          {metrics.topPainPoints.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Desempeño por Vendedor</h3>
        <div className="bar-chart">
          {metrics.bySeller.map((seller) => (
            <div key={seller.seller} className="bar-item">
              <span className="bar-label">{seller.seller}</span>
              <div className="bar-container" style={{ position: "relative" }}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${(seller.total / maxSellerTotal) * 100}%`,
                    background: "var(--color-surface-elevated)",
                  }}
                />
                <div
                  className="bar-fill"
                  style={{
                    width: `${(seller.closed / maxSellerTotal) * 100}%`,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </div>
              <span className="bar-value">{seller.conversionRate.toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            fontSize: "0.75rem",
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                marginRight: "0.5rem",
              }}
            />
            Cerrados
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "var(--color-surface-elevated)",
                marginRight: "0.5rem",
              }}
            />
            Total
          </span>
        </div>
      </div>
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <SankeyChart />
      </div>
    </div>
  );
}
