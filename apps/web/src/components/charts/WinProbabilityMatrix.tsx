"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { UrgencyLabels, SentimentLabels, Urgency, Sentiment } from "@vambe/shared";
import { CustomerFilters } from "@/lib/api";
import { EmptyStateWithType } from "@/components/ui/Loading";

interface WinProbabilityMatrixProps {
  filters?: CustomerFilters;
}

export function WinProbabilityMatrix({ filters }: WinProbabilityMatrixProps) {
  const [data, setData] = useState<{
    matrix: Array<{
      urgency: string;
      sentiment: string;
      total: number;
      closed: number;
      conversionRate: number;
      winProbability: number;
      riskBreakdown: Array<{
        riskLevel: string;
        total: number;
        closed: number;
        conversionRate: number;
      }>;
    }>;
    urgencyStats: Array<{
      urgency: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    sentimentStats: Array<{
      sentiment: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.metrics.winProbability({
        seller: filters?.seller,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to load win probability data", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="card loading-placeholder">Cargando análisis de probabilidad...</div>;
  }

  if (!data || data.matrix.length === 0) {
    return (
      <div className="card">
        <EmptyStateWithType type="win-probability" />
      </div>
    );
  }

  const urgencyOrder = ["BAJA", "MEDIA", "ALTA", "INMEDIATA"];
  const sentimentOrder = ["ESCEPTICO", "NEUTRAL", "POSITIVO"];

  const maxWinProbability = Math.max(...data.matrix.map((c) => c.winProbability), 1);
  const maxTotal = Math.max(...data.matrix.map((c) => c.total), 1);

  const getCellData = (urgency: string, sentiment: string) => {
    return data.matrix.find((c) => c.urgency === urgency && c.sentiment === sentiment) || null;
  };

  const getColor = (cell: { winProbability: number } | null) => {
    if (!cell) return "rgba(0, 0, 0, 0.1)";

    const intensity = cell.winProbability / Math.max(maxWinProbability, 1);

    if (intensity >= 0.7) {
      const r = Math.floor(34 - (intensity - 0.7) * 30 * 3.33);
      const g = Math.floor(197);
      const b = Math.floor(94);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.4, intensity)})`;
    } else if (intensity >= 0.4) {
      const factor = (intensity - 0.4) / 0.3;
      const r = Math.floor(234 - factor * 200);
      const g = Math.floor(179 + factor * 18);
      const b = Math.floor(8 + factor * 86);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.3, intensity)})`;
    } else {
      const factor = intensity / 0.4;
      const r = Math.floor(239 - factor * 5);
      const g = Math.floor(68 + factor * 111);
      const b = Math.floor(68 + factor * 0);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.2, intensity)})`;
    }
  };

  const getCellSize = (cell: { total: number } | null) => {
    if (!cell) return "60px";
    const size = Math.max(60, (cell.total / maxTotal) * 180 + 60);
    return `${size}px`;
  };

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 className="section-title" style={{ marginBottom: "0.5rem" }}>
          Matriz de Probabilidad de Cierre
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Análisis predictivo combinando <strong>Urgencia</strong>, <strong>Sentimiento</strong> y <strong>Nivel de Riesgo</strong> extraídos del LLM.
          El color indica la probabilidad de cierre calculada, el tamaño representa el volumen de leads.
        </p>
      </div>

      <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `120px repeat(${sentimentOrder.length}, minmax(150px, 1fr))`,
            gap: "0.75rem",
            minWidth: "fit-content",
          }}
        >
          <div
            style={{
              padding: "1rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Urgencia / Sentimiento
          </div>

          {sentimentOrder.map((sentiment) => (
            <div
              key={sentiment}
              style={{
                padding: "1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text)",
                textAlign: "center",
                borderBottom: "2px solid var(--color-border)",
              }}
            >
              {SentimentLabels[sentiment as Sentiment] || sentiment}
            </div>
          ))}

          {urgencyOrder.map((urgency) => (
            <React.Fragment key={urgency}>
              <div
                style={{
                  padding: "1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {UrgencyLabels[urgency as Urgency] || urgency}
              </div>

              {sentimentOrder.map((sentiment) => {
                const cell = getCellData(urgency, sentiment);
                return (
                  <div
                    key={`${urgency}-${sentiment}`}
                    style={{
                      background: getColor(cell),
                      borderRadius: "var(--radius-lg)",
                      padding: "1.5rem",
                      minHeight: getCellSize(cell),
                      minWidth: getCellSize(cell),
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: cell ? "pointer" : "default",
                      transition: "all 0.3s ease",
                      border: cell ? "2px solid rgba(255, 255, 255, 0.2)" : "2px dashed var(--color-border)",
                      position: "relative",
                      boxShadow: cell ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (cell) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.zIndex = "20";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (cell) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.zIndex = "1";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                      }
                    }}
                    title={
                      cell
                        ? `${UrgencyLabels[urgency as Urgency] || urgency} × ${SentimentLabels[sentiment as Sentiment] || sentiment}\nTotal: ${cell.total}\nCerrados: ${cell.closed}\nTasa Conversión: ${cell.conversionRate.toFixed(1)}%\nProbabilidad de Cierre: ${cell.winProbability.toFixed(1)}%`
                        : "Sin datos"
                    }
                  >
                    {cell && (
                      <>
                        <div
                          style={{
                            fontSize: "2rem",
                            fontWeight: 700,
                            color: "rgba(255, 255, 255, 0.95)",
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          {cell.winProbability.toFixed(0)}%
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "rgba(255, 255, 255, 0.9)",
                            textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
                            textAlign: "center",
                          }}
                        >
                          {cell.total} leads
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            color: "rgba(255, 255, 255, 0.85)",
                            textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {cell.conversionRate.toFixed(1)}% real
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
        marginTop: "2rem"
      }}>
        <div style={{
          padding: "1rem",
          background: "var(--color-surface-elevated)",
          borderRadius: "var(--radius-md)",
        }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
            Estadísticas por Urgencia
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.urgencyStats.map((stat) => (
              <div key={stat.urgency} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {UrgencyLabels[stat.urgency as Urgency] || stat.urgency}:
                </span>
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {stat.conversionRate.toFixed(1)}% ({stat.closed}/{stat.total})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: "1rem",
          background: "var(--color-surface-elevated)",
          borderRadius: "var(--radius-md)",
        }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
            Estadísticas por Sentimiento
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.sentimentStats.map((stat) => (
              <div key={stat.sentiment} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {SentimentLabels[stat.sentiment as Sentiment] || stat.sentiment}:
                </span>
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {stat.conversionRate.toFixed(1)}% ({stat.closed}/{stat.total})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "var(--color-surface-elevated)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <strong style={{ color: "var(--color-text)" }}>Leyenda:</strong>
          </div>
          <div>
            <span style={{ display: "inline-block", width: "16px", height: "16px", background: "rgba(239, 68, 68, 0.6)", borderRadius: "4px", marginRight: "0.5rem" }} />
            Baja probabilidad (0-40%)
          </div>
          <div>
            <span style={{ display: "inline-block", width: "16px", height: "16px", background: "rgba(234, 179, 8, 0.7)", borderRadius: "4px", marginRight: "0.5rem" }} />
            Media probabilidad (40-70%)
          </div>
          <div>
            <span style={{ display: "inline-block", width: "16px", height: "16px", background: "rgba(34, 197, 94, 0.8)", borderRadius: "4px", marginRight: "0.5rem" }} />
            Alta probabilidad (70-100%)
          </div>
          <div style={{ marginLeft: "auto", fontSize: "0.7rem" }}>
            * Probabilidad calculada usando Urgencia, Sentimiento y Nivel de Riesgo
          </div>
        </div>
      </div>
    </div>
  );
}
