"use client";

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
              <span className="bar-label" style={{ textAlign: "left", flex: "0 0 140px" }}>
                {LeadSourceLabels[item.source as LeadSource] || item.source}
              </span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(item.count / maxLeadSourceCount) * 100}%` }}
                />
              </div>
              <span className="bar-value" style={{ textAlign: "right" }}>{item.count}</span>
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
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.875rem",
                    color: "var(--color-text)",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {metrics.bySeller.map((seller) => {
            const closedPercentage = seller.total > 0 ? (seller.closed / seller.total) * 100 : 0;
            const barWidth = seller.total > 0 ? (seller.total / maxSellerTotal) * 100 : 0;

            return (
              <div key={seller.seller} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ minWidth: "120px" }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>
                    {seller.seller}
                  </div>
                </div>
                <div style={{ position: "relative", flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: "28px",
                      background: "var(--color-surface-elevated)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${closedPercentage}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                        transition: "width 0.5s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: closedPercentage > 10 ? "0.5rem" : "0",
                        boxSizing: "border-box",
                      }}
                    >
                      {closedPercentage > 12 && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                          {seller.closed}
                        </span>
                      )}
                    </div>
                    {closedPercentage <= 12 && seller.closed > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: "0.5rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        {seller.closed}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", minWidth: "40px", textAlign: "left" }}>
                    {seller.total}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            fontSize: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
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
          <span style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
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
    </div>
  );
}
