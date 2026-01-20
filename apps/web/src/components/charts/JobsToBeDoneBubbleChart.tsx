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
import { JtbdPrimaryLabels, JtbdPrimary } from "@vambe/shared";
import { EmptyStateWithType } from "@/components/ui/Loading";

interface JtbdData {
  x: number;
  y: number;
  z: number;
  name: string;
  closed: number;
  jtbd: string;
}

export function JobsToBeDoneBubbleChart() {
  const [allData, setAllData] = useState<JtbdData[]>([]);
  const [data, setData] = useState<JtbdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeRange, setSizeRange] = useState<[number, number]>([15, 50]);
  const [selectedJtbds, setSelectedJtbds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.metrics.overview()
      .then((metrics) => {
        const chartData = metrics.topJobsToBeDone.map((jtbd) => ({
          x: jtbd.count,
          y: parseFloat(jtbd.conversionRate.toFixed(1)),
          z: jtbd.count,
          name: JtbdPrimaryLabels[jtbd.jtbd as JtbdPrimary] || jtbd.jtbd,
          closed: jtbd.closed,
          jtbd: jtbd.jtbd,
        }));

        setAllData(chartData);
        const allJtbds = new Set(chartData.map(d => d.jtbd));
        setSelectedJtbds(allJtbds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const filtered = allData.filter((d) => selectedJtbds.has(d.jtbd));

    if (filtered.length > 0) {
      const counts = filtered.map(d => d.z);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      const minSize = 20;
      const maxSize = Math.max(80, maxCount * 6);
      setSizeRange([minSize, maxSize]);
    }

    setData(filtered);
  }, [allData, selectedJtbds]);

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

  const toggleJtbd = (jtbd: string) => {
    setSelectedJtbds((prev) => {
      const next = new Set(prev);
      if (next.has(jtbd)) {
        next.delete(jtbd);
      } else {
        next.add(jtbd);
      }
      return next;
    });
  };

  const availableJtbds = Array.from(new Set(allData.map(d => d.jtbd)));

  return (
    <div className="card jtbd-chart-container">
      <div className="jtbd-chart-header">
        <h3 className="section-title">Mapa de Impacto: Jobs to be Done</h3>
        <p className="jtbd-chart-description">
          Volumen de Leads vs. Tasa de Conversión.
        </p>
        <div className="jtbd-filter-section">
          <label className="jtbd-filter-label">
            Filtrar Jobs to be Done:
          </label>
          <div className="jtbd-filter-buttons">
            {availableJtbds.map((jtbd) => {
              const label = JtbdPrimaryLabels[jtbd as JtbdPrimary] || jtbd;
              const isSelected = selectedJtbds.has(jtbd);
              return (
                <button
                  key={jtbd}
                  onClick={() => toggleJtbd(jtbd)}
                  className={`jtbd-filter-button ${isSelected ? 'selected' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="jtbd-legend-section">
          <span>• <strong>Eje X:</strong> Cantidad de leads (Volumen)</span>
          <span>• <strong>Eje Y:</strong> Efectividad de venta (Conversión %)</span>
          <span>• <strong>Tamaño:</strong> Número de casos (Count)</span>
        </div>
      </div>

      <div className="jtbd-chart-body">
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
                    <div className="jtbd-tooltip">
                      <p className="jtbd-tooltip-title">
                        {data.name}
                      </p>
                      <div className="jtbd-tooltip-content">
                        <div className="jtbd-tooltip-row">
                          <span className="jtbd-tooltip-label">Volumen:</span>
                          <span className="jtbd-tooltip-value">{data.x} leads</span>
                        </div>
                        <div className="jtbd-tooltip-row">
                          <span className="jtbd-tooltip-label">Conversión:</span>
                          <span className="jtbd-tooltip-value conversion" style={{ color: getColor(data.y) }}>
                            {data.y}%
                          </span>
                        </div>
                        <div className="jtbd-tooltip-row">
                          <span className="jtbd-tooltip-label">Casos (Count):</span>
                          <span className="jtbd-tooltip-value">{data.z}</span>
                        </div>
                        <div className="jtbd-tooltip-row">
                          <span className="jtbd-tooltip-label">Cerrados:</span>
                          <span className="jtbd-tooltip-value" style={{ color: "#22c55e" }}>{data.closed}</span>
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
              name="Jobs to be Done"
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
                      className="jtbd-bubble"
                    />
                    <circle
                      cx={validCx}
                      cy={validCy}
                      r={Math.max(4, validR * 0.35)}
                      fill={color}
                      className="jtbd-bubble-core"
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
