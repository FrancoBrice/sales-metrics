"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { UrgencyLabels, SentimentLabels, Urgency, Sentiment } from "@vambe/shared";
import { CustomerFilters } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipRow } from "@/components/ui/Tooltip";
import { EmptyStateWithType } from "@/components/ui/Loading";
import "@/styles/charts/win-probability-matrix.css";

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
    } catch {
      setData(null);
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
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.75, intensity)})`;
    } else if (intensity >= 0.4) {
      const factor = (intensity - 0.4) / 0.3;
      const r = Math.floor(234 - factor * 200);
      const g = Math.floor(179 + factor * 18);
      const b = Math.floor(8 + factor * 86);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.65, intensity)})`;
    } else {
      const factor = intensity / 0.4;
      const r = Math.floor(239 - factor * 5);
      const g = Math.floor(68 + factor * 111);
      const b = Math.floor(68 + factor * 0);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.45, intensity)})`;
    }
  };

  const getCellSize = (cell: { total: number } | null) => {
    if (!cell) return "60px";
    const size = Math.max(60, (cell.total / maxTotal) * 180 + 60);
    return `${size}px`;
  };

  return (
    <div className="card win-probability-matrix-card">
      <div className="win-probability-matrix-header-section">
        <h3 className="section-title win-probability-matrix-section-title">
          Matriz de Probabilidad de Cierre
        </h3>
        <p className="win-probability-matrix-description">
          Análisis predictivo combinando <strong>Urgencia</strong>, <strong>Sentimiento</strong> y <strong>Nivel de Riesgo</strong> extraídos del LLM.
          El color indica la probabilidad de cierre calculada, el tamaño representa el volumen de leads.
        </p>
      </div>

      <div className="win-probability-matrix-scroll-container">
        <div
          className="win-probability-matrix-grid"
          style={{
            "--sentiment-count": sentimentOrder.length
          } as React.CSSProperties}
        >
          <div className="win-probability-matrix-header-cell win-probability-matrix-header-cell.first">
            Urgencia / Sentimiento
          </div>

          {sentimentOrder.map((sentiment) => (
            <div
              key={sentiment}
              className="win-probability-matrix-sentiment-header"
            >
              {SentimentLabels[sentiment as Sentiment] || sentiment}
            </div>
          ))}

          {urgencyOrder.map((urgency) => (
            <React.Fragment key={urgency}>
              <div className="win-probability-matrix-row-header">
                {UrgencyLabels[urgency as Urgency] || urgency}
              </div>

              {sentimentOrder.map((sentiment) => {
                const cell = getCellData(urgency, sentiment);
                return (
                  <div
                    key={`${urgency}-${sentiment}`}
                    className={cell ? "win-probability-matrix-cell filled" : "win-probability-matrix-cell win-probability-matrix-cell-empty"}
                    style={{
                      background: getColor(cell),
                      minHeight: getCellSize(cell),
                      minWidth: getCellSize(cell),
                    }}
                  >
                    {cell && (
                      <Tooltip
                        content={
                          <TooltipContent
                            title={`${UrgencyLabels[urgency as Urgency] || urgency} / ${SentimentLabels[sentiment as Sentiment] || sentiment}`}
                          >
                            <TooltipRow
                              label="Total Leads"
                              value={cell.total}
                            />
                            <TooltipRow
                              label="Cerrados"
                              value={cell.closed}
                            />
                            <TooltipRow
                              label="Tasa Conversión"
                              value={`${cell.conversionRate.toFixed(1)}%`}
                            />
                            <TooltipRow
                              label="Prob. Cierre"
                              value={`${cell.winProbability.toFixed(1)}%`}
                              valueColor={cell.winProbability > 70 ? 'var(--color-success)' : cell.winProbability > 40 ? 'var(--color-info)' : 'var(--color-danger)'}
                            />
                          </TooltipContent>
                        }
                      >
                        <div className="win-probability-matrix-cell-content-wrapper">
                          <div className="win-probability-matrix-cell-probability">
                            {cell.winProbability.toFixed(0)}%
                          </div>
                          <div className="win-probability-matrix-cell-count">
                            {cell.total} leads
                          </div>
                          <div className="win-probability-matrix-cell-percentage">
                            {cell.conversionRate.toFixed(1)}% real
                          </div>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="win-probability-matrix-stats-section">
        <div className="win-probability-matrix-stats-card">
          <h4 className="win-probability-matrix-stats-title">
            Estadísticas por Urgencia
          </h4>
          <div className="win-probability-matrix-stats-list">
            {data.urgencyStats.map((stat) => (
              <div key={stat.urgency} className="win-probability-matrix-stats-item">
                <span className="win-probability-matrix-stats-label">
                  {UrgencyLabels[stat.urgency as Urgency] || stat.urgency}:
                </span>
                <span className="win-probability-matrix-stats-value">
                  {stat.conversionRate.toFixed(1)}% ({stat.closed}/{stat.total})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="win-probability-matrix-stats-card">
          <h4 className="win-probability-matrix-stats-title">
            Estadísticas por Sentimiento
          </h4>
          <div className="win-probability-matrix-stats-list">
            {data.sentimentStats.map((stat) => (
              <div key={stat.sentiment} className="win-probability-matrix-stats-item">
                <span className="win-probability-matrix-stats-label">
                  {SentimentLabels[stat.sentiment as Sentiment] || stat.sentiment}:
                </span>
                <span className="win-probability-matrix-stats-value">
                  {stat.conversionRate.toFixed(1)}% ({stat.closed}/{stat.total})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="win-probability-matrix-legend">
        <div className="win-probability-matrix-legend-content">
          <div className="win-probability-matrix-legend-item">
            <strong>Leyenda:</strong>
          </div>
          <div className="win-probability-matrix-legend-item">
            <span className="win-probability-matrix-legend-color" style={{ background: "rgba(239, 68, 68, 0.7)" }} />
            Baja probabilidad (0-40%)
          </div>
          <div className="win-probability-matrix-legend-item">
            <span className="win-probability-matrix-legend-color" style={{ background: "rgba(234, 179, 8, 0.8)" }} />
            Media probabilidad (40-70%)
          </div>
          <div className="win-probability-matrix-legend-item">
            <span className="win-probability-matrix-legend-color" style={{ background: "rgba(34, 197, 94, 0.9)" }} />
            Alta probabilidad (70-100%)
          </div>
          <div className="win-probability-matrix-legend-note">
            * Probabilidad calculada usando Urgencia, Sentimiento y Nivel de Riesgo
          </div>
        </div>
      </div>
    </div>
  );
}
