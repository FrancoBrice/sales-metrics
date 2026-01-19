"use client";

import React, { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea } from "recharts";
import { api } from "@/lib/api";
import { IndustryLabels, PainPointsLabels, Industry, PainPoints } from "@vambe/shared";
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
        <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>
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
      return "#22c55e";
    }
    if (data.quadrants.quickWins.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return "#eab308";
    }
    if (data.quadrants.development.some((q) => q.name === opportunity.name && q.category === opportunity.category)) {
      return "#f59e0b";
    }
    return "#ef4444";
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
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: "0.5rem" }}>
            Matriz de Oportunidad Estratégica
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Visualiza oportunidades priorizadas por volumen y tasa de conversión.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowCategory("all")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `2px solid ${showCategory === "all" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: showCategory === "all" ? "var(--color-primary)" : "var(--color-surface-elevated)",
              color: showCategory === "all" ? "white" : "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: showCategory === "all" ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Todos
          </button>
          <button
            onClick={() => setShowCategory("industry")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `2px solid ${showCategory === "industry" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: showCategory === "industry" ? "var(--color-primary)" : "var(--color-surface-elevated)",
              color: showCategory === "industry" ? "white" : "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: showCategory === "industry" ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Industrias
          </button>
          <button
            onClick={() => setShowCategory("painPoint")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `2px solid ${showCategory === "painPoint" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: showCategory === "painPoint" ? "var(--color-primary)" : "var(--color-surface-elevated)",
              color: showCategory === "painPoint" ? "white" : "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: showCategory === "painPoint" ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Pain Points
          </button>
        </div>
      </div>

      <div style={{ height: "600px", marginBottom: "2rem" }}>
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
              fill="#22c55e"
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={0}
              y1={data.thresholds.conversion}
              x2={data.thresholds.volume}
              y2={maxConversion * 1.1}
              fill="#eab308"
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={data.thresholds.volume}
              y1={0}
              x2={maxVolume * 1.1}
              y2={data.thresholds.conversion}
              fill="#f59e0b"
              fillOpacity={0.05}
              stroke="none"
            />
            <ReferenceArea
              x1={0}
              y1={0}
              x2={data.thresholds.volume}
              y2={data.thresholds.conversion}
              fill="#ef4444"
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
                          <span style={{ fontWeight: 600, color: "#22c55e" }}>{data.closed}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Oportunidades" data={chartData} fill="#8884d8">
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
        <div style={{
          padding: "1rem",
          background: "rgba(34, 197, 94, 0.1)",
          border: "2px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "12px",
              height: "12px",
              background: "#22c55e",
              borderRadius: "3px"
            }} />
            <strong style={{ color: "#22c55e" }}>Alto Valor</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {data.quadrants.highValue.length} oportunidades
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Alto volumen y alta conversión. Priorizar y escalar.
          </p>
        </div>

        <div style={{
          padding: "1rem",
          background: "rgba(234, 179, 8, 0.1)",
          border: "2px solid rgba(234, 179, 8, 0.3)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "12px",
              height: "12px",
              background: "#eab308",
              borderRadius: "3px"
            }} />
            <strong style={{ color: "#eab308" }}>Quick Wins</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {data.quadrants.quickWins.length} oportunidades
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Bajo volumen pero alta conversión. Fácil de cerrar.
          </p>
        </div>

        <div style={{
          padding: "1rem",
          background: "rgba(245, 158, 11, 0.1)",
          border: "2px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "12px",
              height: "12px",
              background: "#f59e0b",
              borderRadius: "3px"
            }} />
            <strong style={{ color: "#f59e0b" }}>Desarrollo</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {data.quadrants.development.length} oportunidades
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Alto volumen pero baja conversión. Mejorar estrategia.
          </p>
        </div>

        <div style={{
          padding: "1rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "2px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-md)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{
              width: "12px",
              height: "12px",
              background: "#ef4444",
              borderRadius: "3px"
            }} />
            <strong style={{ color: "#ef4444" }}>Baja Prioridad</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto" }}>
              {data.quadrants.lowPriority.length} oportunidades
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Bajo volumen y baja conversión. Evaluar cuidadosamente.
          </p>
        </div>
      </div>
    </div>
  );
}
