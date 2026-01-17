"use client";

import { MetricsOverview } from "@/lib/api";
import { LeadSourceLabels, PainPointsLabels, LeadSource, PainPoints } from "@vambe/shared";

interface ChartsSectionProps {
  metrics: MetricsOverview | null;
}

export function ChartsSection({ metrics }: ChartsSectionProps) {
  if (!metrics) return null;

  const maxLeadSourceCount = Math.max(...metrics.topLeadSources.map((s) => s.count), 1);
  const maxPainPointCount = Math.max(...metrics.topPainPoints.map((p) => p.count), 1);
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
        <h3 className="section-title">Principales Pain Points</h3>
        <div className="bar-chart">
          {metrics.topPainPoints.map((item) => (
            <div key={item.painPoint} className="bar-item">
              <span className="bar-label">
                {PainPointsLabels[item.painPoint as PainPoints] || item.painPoint}
              </span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(item.count / maxPainPointCount) * 100}%` }}
                />
              </div>
              <span className="bar-value">{item.count}</span>
            </div>
          ))}
          {metrics.topPainPoints.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>
              Sin datos
            </p>
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
    </div>
  );
}
