"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";
import { api } from "@/lib/api";
import { PainPointsLabels, PainPoints } from "@vambe/shared";
import { EmptyStateWithType } from "@/components/ui/Loading";

interface PainPointData {
  x: number;
  y: number;
  z: number;
  name: string;
  closed: number;
  painPoint: string;
}

export function PainPointsBubbleChart() {
  const [allData, setAllData] = useState<PainPointData[]>([]);
  const [data, setData] = useState<PainPointData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeRange, setSizeRange] = useState<[number, number]>([15, 50]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.metrics.overview()
      .then((metrics) => {
        const chartData = metrics.topPainPoints.map((pp) => ({
          x: pp.count,
          y: parseFloat(pp.conversionRate.toFixed(1)),
          z: pp.count,
          name: PainPointsLabels[pp.painPoint as PainPoints] || pp.painPoint,
          closed: pp.closed,
          painPoint: pp.painPoint,
        }));

        setAllData(chartData);
        const allPainPoints = new Set(chartData.map(d => d.painPoint));
        setSelectedPainPoints(allPainPoints);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const filtered = allData.filter((d) => selectedPainPoints.has(d.painPoint));

    if (filtered.length > 0) {
      const counts = filtered.map(d => d.z);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      const minSize = 20;
      const maxSize = Math.max(80, maxCount * 6);
      setSizeRange([minSize, maxSize]);
    }

    setData(filtered);
  }, [allData, selectedPainPoints]);

  if (loading) return <div className="card loading-placeholder">Cargando gráfico...</div>;
  if (data.length === 0) return (
    <div className="card">
      <EmptyStateWithType type="pain-points" />
    </div>
  );

  const getColor = (rate: number) => {
    if (rate <= 10) return "#ef4444";
    if (rate <= 30) return "#eab308";
    return "#22c55e";
  };

  const getColorWithOpacity = (rate: number, opacity: number = 0.7) => {
    const baseColor = getColor(rate);
    if (baseColor.startsWith("#")) {
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return baseColor;
  };

  const togglePainPoint = (painPoint: string) => {
    setSelectedPainPoints((prev) => {
      const next = new Set(prev);
      if (next.has(painPoint)) {
        next.delete(painPoint);
      } else {
        next.add(painPoint);
      }
      return next;
    });
  };

  const availablePainPoints = Array.from(new Set(allData.map(d => d.painPoint)));

  return (
    <div className="card" style={{
      height: "650px",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-surface)",
      borderRadius: "12px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    }}>
      <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
        <h3 className="section-title" style={{ marginBottom: "0.75rem" }}>Mapa de Impacto: Pain Points</h3>
        <p style={{
          fontSize: "0.85rem",
          color: "var(--color-text-muted)",
          marginBottom: "1rem",
          lineHeight: "1.5"
        }}>
          Volumen de Leads vs. Tasa de Conversión.
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            fontWeight: 500,
            display: "block",
            marginBottom: "0.5rem"
          }}>
            Filtrar Pain Points:
          </label>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            {availablePainPoints.map((pp) => {
              const label = PainPointsLabels[pp as PainPoints] || pp;
              const isSelected = selectedPainPoints.has(pp);
              return (
                <button
                  key={pp}
                  onClick={() => togglePainPoint(pp)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-surface-elevated)",
                    color: isSelected
                      ? "white"
                      : "var(--color-text)",
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                      e.currentTarget.style.background = "rgba(var(--color-primary-rgb), 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.background = "var(--color-surface-elevated)";
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap"
        }}>
          <span>• <strong>Eje X:</strong> Cantidad de leads (Volumen)</span>
          <span>• <strong>Eje Y:</strong> Efectividad de venta (Conversión %)</span>
          <span>• <strong>Tamaño:</strong> Número de casos (Count)</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: "0 1.5rem 1.5rem" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 50 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.3}
            />
            <XAxis
              type="number"
              dataKey="x"
              name="Volumen"
              unit=""
              domain={['auto', 'auto']}
              label={{
                value: 'Volumen de Leads',
                position: 'insideBottom',
                offset: -5,
                style: {
                  fill: "var(--color-text)",
                  fontSize: "0.875rem",
                  fontWeight: 500
                }
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
                style: {
                  fill: "var(--color-text)",
                  fontSize: "0.875rem",
                  fontWeight: 500
                }
              }}
              tick={{ fill: "var(--color-text-muted)", fontSize: "0.75rem" }}
              axisLine={{ stroke: "var(--color-border)" }}
            />
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
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      minWidth: "200px"
                    }}>
                      <p style={{
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                        color: "var(--color-text)"
                      }}>
                        {data.name}
                      </p>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                        fontSize: "0.875rem"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Volumen:</span>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.x} leads</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Conversión:</span>
                          <span style={{
                            fontWeight: 600,
                            color: getColor(data.y)
                          }}>
                            {data.y}%
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Casos (Count):</span>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.z}</span>
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
            <ZAxis
              type="number"
              dataKey="z"
              range={sizeRange}
              name="Count"
            />
            <Scatter
              name="Pain Points"
              data={data}
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload, r } = props;
                const validCx = typeof cx === 'number' ? cx : 0;
                const validCy = typeof cy === 'number' ? cy : 0;
                const validR = typeof r === 'number' && r > 0 ? Math.max(8, r) : 10;
                const color = payload?.y !== undefined ? getColor(payload.y) : "#8884d8";
                const colorWithOpacity = payload?.y !== undefined ? getColorWithOpacity(payload.y, 0.7) : "rgba(136, 132, 216, 0.7)";
                return (
                  <g>
                    <circle
                      cx={validCx}
                      cy={validCy}
                      r={validR}
                      fill={colorWithOpacity}
                      stroke={color}
                      strokeWidth={2.5}
                      style={{
                        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))",
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                    />
                    <circle
                      cx={validCx}
                      cy={validCy}
                      r={Math.max(4, validR * 0.35)}
                      fill={color}
                      opacity={0.9}
                    />
                  </g>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.y)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
