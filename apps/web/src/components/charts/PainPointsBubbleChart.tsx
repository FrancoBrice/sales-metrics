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
import { quadrantColors, chartColors } from "@/constants/colors";

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
    if (rate <= 10) return quadrantColors.lowPriority;
    if (rate <= 30) return quadrantColors.quickWins;
    return quadrantColors.highValue;
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
    <div className="card pain-points-chart-container">
      <div className="pain-points-chart-header">
        <h3 className="pain-points-chart-title">Mapa de Impacto: Pain Points</h3>
        <p className="pain-points-chart-description">
          Volumen de Leads vs. Tasa de Conversión.
        </p>
        <div className="pain-points-filter-section">
          <label className="pain-points-filter-label">
            Filtrar Pain Points:
          </label>
          <div className="pain-points-filter-buttons">
            {availablePainPoints.map((pp) => {
              const label = PainPointsLabels[pp as PainPoints] || pp;
              const isSelected = selectedPainPoints.has(pp);
              return (
                <button
                  key={pp}
                  onClick={() => togglePainPoint(pp)}
                  className={`pain-points-filter-button ${isSelected ? 'selected' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pain-points-legend-section">
          <span>• <strong>Eje X:</strong> Cantidad de leads (Volumen)</span>
          <span>• <strong>Eje Y:</strong> Efectividad de venta (Conversión %)</span>
          <span>• <strong>Tamaño:</strong> Número de casos (Count)</span>
        </div>
      </div>

      <div className="pain-points-chart-body">
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
                    <div className="pain-points-tooltip">
                      <p className="pain-points-tooltip-title">
                        {data.name}
                      </p>
                      <div className="pain-points-tooltip-content">
                        <div className="pain-points-tooltip-row">
                          <span className="pain-points-tooltip-label">Volumen:</span>
                          <span className="pain-points-tooltip-value">{data.x} leads</span>
                        </div>
                        <div className="pain-points-tooltip-row">
                          <span className="pain-points-tooltip-label">Conversión:</span>
                          <span className="pain-points-tooltip-value conversion" style={{ color: getColor(data.y) }}>
                            {data.y}%
                          </span>
                        </div>
                        <div className="pain-points-tooltip-row">
                          <span className="pain-points-tooltip-label">Casos (Count):</span>
                          <span className="pain-points-tooltip-value">{data.z}</span>
                        </div>
                        <div className="pain-points-tooltip-row">
                          <span className="pain-points-tooltip-label">Cerrados:</span>
                          <span className="pain-points-tooltip-value" style={{ color: quadrantColors.highValue }}>{data.closed}</span>
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
              fill={chartColors.default}
              shape={(props: any) => {
                const { cx, cy, payload, r } = props;
                const validCx = typeof cx === 'number' ? cx : 0;
                const validCy = typeof cy === 'number' ? cy : 0;
                const validR = typeof r === 'number' && r > 0 ? Math.max(8, r) : 10;
                const color = payload?.y !== undefined ? getColor(payload.y) : chartColors.default;
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
                      className="pain-points-bubble"
                    />
                    <circle
                      cx={validCx}
                      cy={validCy}
                      r={Math.max(4, validR * 0.35)}
                      fill={color}
                      className="pain-points-bubble-core"
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
