"use client";

import React, { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea } from "recharts";
import { api } from "@/lib/api";
import { IndustryLabels, PainPointsLabels, Industry, PainPoints } from "@vambe/shared";
import { quadrantColors, chartColors } from "@/constants/colors";
import { CustomerFilters } from "@/lib/api";

interface OpportunityMatrixProps {
  filters?: CustomerFilters;
}

interface Opportunity {
  category: "industry" | "painPoint";
  name: string;
  total: number;
  closed: number;
  avgVolume: number;
  conversionRate: number;
}

export function OpportunityMatrix({ filters }: OpportunityMatrixProps) {
  const [data, setData] = useState<{
    opportunities: Opportunity[];
    quadrants: {
      highValue: Opportunity[];
      quickWins: Opportunity[];
      development: Opportunity[];
      lowPriority: Opportunity[];
    };
    thresholds: {
      volume: number;
      conversion: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategory, setShowCategory] = useState<"all" | "industry" | "painPoint">("all");

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.metrics.opportunityMatrix({
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
    return <div className="card loading-placeholder">Cargando matriz de oportunidades...</div>;
  }

  if (!data || data.opportunities.length === 0) {
    return (
      <div className="card">
        <p className="opportunity-matrix-empty-message">
          No hay datos disponibles para la matriz de oportunidades
        </p>
      </div>
    );
  }

  const filteredOpportunities = showCategory === "all"
    ? data.opportunities
    : data.opportunities.filter((o) => o.category === showCategory);

  const maxVolume = Math.max(...data.opportunities.map((o) => o.avgVolume), 1);
  const maxConversion = Math.max(...data.opportunities.map((o) => o.conversionRate), 1);
  const maxTotal = Math.max(...data.opportunities.map((o) => o.total), 1);

  const getQuadrantColor = (opportunity: Opportunity): string => {
    if (data.quadrants.highValue.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return quadrantColors.highValue;
    }
    if (data.quadrants.quickWins.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return quadrantColors.quickWins;
    }
    if (data.quadrants.development.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return quadrantColors.development;
    }
    return quadrantColors.lowPriority;
  };

  const getQuadrantName = (opportunity: Opportunity): string => {
    if (data.quadrants.highValue.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return "Alto Valor";
    }
    if (data.quadrants.quickWins.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return "Quick Wins";
    }
    if (data.quadrants.development.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return "Desarrollo";
    }
    return "Baja Prioridad";
  };

  const chartData = filteredOpportunities.map((opp) => ({
    x: opp.avgVolume,
    y: opp.conversionRate,
    z: opp.total,
    name: opp.category === "industry"
      ? IndustryLabels[opp.name as Industry] || opp.name
      : PainPointsLabels[opp.name as PainPoints] || opp.name,
    category: opp.category,
    fullName: opp.name,
    total: opp.total,
    closed: opp.closed,
    quadrant: getQuadrantName(opp),
  }));

  const getSize = (value: number) => {
    const minSize = 30;
    const maxSize = 120;
    return minSize + ((value / maxTotal) * (maxSize - minSize));
  };

  return (
    <div className="card opportunity-matrix-card">
      <div className="opportunity-matrix-header">
        <div>
          <h3 className="section-title opportunity-matrix-section-title">
            Matriz de Oportunidad Estratégica
          </h3>
          <p className="opportunity-matrix-description">
            Visualiza oportunidades priorizadas por volumen y tasa de conversión.
          </p>
        </div>
        <div className="opportunity-matrix-controls">
          <button
            onClick={() => setShowCategory("all")}
            className={`opportunity-matrix-toggle-button ${showCategory === "all" ? "active" : ""}`}
          >
            Todos
          </button>
          <button
            onClick={() => setShowCategory("industry")}
            className={`opportunity-matrix-toggle-button ${showCategory === "industry" ? "active" : ""}`}
          >
            Industrias
          </button>
          <button
            onClick={() => setShowCategory("painPoint")}
            className={`opportunity-matrix-toggle-button ${showCategory === "painPoint" ? "active" : ""}`}
          >
            Pain Points
          </button>
        </div>
      </div>

      <div className="opportunity-matrix-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />

            <ReferenceLine
              x={data.thresholds.volume}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              strokeWidth={2}
              opacity={0.5}
            />
            <ReferenceLine
              y={data.thresholds.conversion}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              strokeWidth={2}
              opacity={0.5}
            />

            <ReferenceArea
              x1={data.thresholds.volume}
              y1={data.thresholds.conversion}
              x2={maxVolume * 1.1}
              y2={maxConversion * 1.1}
              fill={quadrantColors.highValue}
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={0}
              y1={data.thresholds.conversion}
              x2={data.thresholds.volume}
              y2={maxConversion * 1.1}
              fill={quadrantColors.quickWins}
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={data.thresholds.volume}
              y1={0}
              x2={maxVolume * 1.1}
              y2={data.thresholds.conversion}
              fill={quadrantColors.development}
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={0}
              y1={0}
              x2={data.thresholds.volume}
              y2={data.thresholds.conversion}
              fill={quadrantColors.lowPriority}
              fillOpacity={0.05}
              stroke="none"
            />

            <XAxis
              type="number"
              dataKey="x"
              name="Volumen"
              unit=""
              domain={[0, 'auto']}
              label={{
                value: 'Volumen Promedio',
                position: 'insideBottom',
                offset: -10,
                style: { fill: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }
              }}
              tick={{ fill: "var(--color-text-muted)", fontSize: "0.75rem" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Conversión"
              unit="%"
              domain={[0, 'auto']}
              label={{
                value: 'Tasa de Conversión (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: "var(--color-text)", fontSize: "0.875rem", fontWeight: 500 }
              }}
              tick={{ fill: "var(--color-text-muted)", fontSize: "0.75rem" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <ZAxis type="number" dataKey="z" range={[30, 120]} name="Cantidad" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: "var(--color-border)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      background: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border)",
                      padding: "1rem",
                      borderRadius: "10px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      minWidth: "250px"
                    }}>
                      <p style={{
                        fontWeight: 700,
                        marginBottom: "0.75rem",
                        fontSize: "1rem",
                        color: "var(--color-text)"
                      }}>
                        {data.name}
                      </p>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        fontSize: "0.875rem"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Cuadrante:</span>
                          <span style={{ fontWeight: 600, color: getQuadrantColor({ category: data.category, name: data.fullName, total: 0, closed: 0, avgVolume: 0, conversionRate: 0 } as Opportunity) }}>
                            {data.quadrant}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Volumen Promedio:</span>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.x}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Conversión:</span>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.y.toFixed(1)}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Total Leads:</span>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.total}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Cerrados:</span>
                          <span style={{ fontWeight: 600, color: quadrantColors.highValue }}>{data.closed}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Oportunidades" data={chartData} fill={chartColors.default}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getQuadrantColor({
                    category: entry.category,
                    name: entry.fullName,
                    total: entry.total,
                    closed: entry.closed,
                    avgVolume: entry.x,
                    conversionRate: entry.y,
                  } as Opportunity)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
        marginTop: "2rem"
      }}>
        <div className="opportunity-matrix-legend-item opportunity-matrix-legend-high-value">
          <div className="opportunity-matrix-legend-color" style={{ background: quadrantColors.highValue }}></div>
          <div>
            <strong style={{ color: quadrantColors.highValue }}>Alto Valor</strong>
            <p>Alto volumen y alta conversión. Priorizar y escalar.</p>
            <span className="opportunity-matrix-legend-count">
              {data.quadrants.highValue.length} oportunidades
            </span>
          </div>
        </div>

        <div className="opportunity-matrix-legend-item opportunity-matrix-legend-quick-wins">
          <div className="opportunity-matrix-legend-color" style={{ background: quadrantColors.quickWins }}></div>
          <div>
            <strong style={{ color: quadrantColors.quickWins }}>Quick Wins</strong>
            <p>Bajo volumen pero alta conversión. Fácil de cerrar.</p>
            <span className="opportunity-matrix-legend-count">
              {data.quadrants.quickWins.length} oportunidades
            </span>
          </div>
        </div>

        <div className="opportunity-matrix-legend-item opportunity-matrix-legend-development">
          <div className="opportunity-matrix-legend-color" style={{ background: quadrantColors.development }}></div>
          <div>
            <strong style={{ color: quadrantColors.development }}>Desarrollo</strong>
            <p>Alto volumen pero baja conversión. Mejorar estrategia.</p>
            <span className="opportunity-matrix-legend-count">
              {data.quadrants.development.length} oportunidades
            </span>
          </div>
        </div>

        <div className="opportunity-matrix-legend-item opportunity-matrix-legend-low-priority">
          <div className="opportunity-matrix-legend-color" style={{ background: quadrantColors.lowPriority }}></div>
          <div>
            <strong style={{ color: quadrantColors.lowPriority }}>Baja Prioridad</strong>
            <p>Bajo volumen y baja conversión. Evaluar cuidadosamente.</p>
            <span className="opportunity-matrix-legend-count">
              {data.quadrants.lowPriority.length} oportunidades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
