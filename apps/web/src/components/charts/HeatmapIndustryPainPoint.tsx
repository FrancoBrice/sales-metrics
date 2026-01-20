"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IndustryLabels, PainPointsLabels, Industry, PainPoints } from "@vambe/shared";
import { CustomerFilters } from "@/lib/api";
import { EmptyStateWithType } from "@/components/ui/Loading";

interface HeatmapIndustryPainPointProps {
  filters?: CustomerFilters;
}

export function HeatmapIndustryPainPoint({ filters }: HeatmapIndustryPainPointProps) {
  const [data, setData] = useState<{
    industries: string[];
    painPoints: string[];
    cells: Array<{
      industry: string;
      painPoint: string;
      total: number;
      closed: number;
      conversionRate: number;
      avgVolume: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<"conversion" | "volume">("conversion");

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.metrics.industryPainPointHeatmap({
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
    return <div className="card loading-placeholder">Cargando heatmap...</div>;
  }

  if (!data || data.cells.length === 0) {
    return (
      <div className="card">
        <EmptyStateWithType type="industries" />
      </div>
    );
  }

  const maxConversion = Math.max(...data.cells.map((c) => c.conversionRate), 0);
  const maxVolume = Math.max(...data.cells.map((c) => c.avgVolume), 0);
  const maxTotal = Math.max(...data.cells.map((c) => c.total), 1);

  const getCellData = (industry: string, painPoint: string) => {
    return data.cells.find((c) => c.industry === industry && c.painPoint === painPoint) || null;
  };

  const getColor = (cell: { conversionRate: number; avgVolume: number } | null) => {
    if (!cell) return "rgba(0, 0, 0, 0.1)";

    if (colorMode === "conversion") {
      const intensity = cell.conversionRate / Math.max(maxConversion, 1);
      const r = Math.floor(239 - intensity * 217);
      const g = Math.floor(68 + intensity * 129);
      const b = Math.floor(68);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.3, intensity)})`;
    } else {
      const intensity = cell.avgVolume / Math.max(maxVolume, 1);
      const r = Math.floor(99 - intensity * 60);
      const g = Math.floor(102 - intensity * 60);
      const b = Math.floor(241 - intensity * 200);
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.3, intensity)})`;
    }
  };

  const getCellSize = (cell: { total: number } | null) => {
    if (!cell) return "0.5rem";
    const size = Math.max(0.5, (cell.total / maxTotal) * 2);
    return `${size}rem`;
  };

  return (
    <div className="card heatmap-container">
      <div className="heatmap-header">
        <div>
          <h3 className="heatmap-title">
            Matriz Industria × Pain Point
          </h3>
          <p className="heatmap-description">
            Visualiza la relación entre industrias y pain points. El tamaño indica volumen, el color indica{" "}
            {colorMode === "conversion" ? "tasa de conversión" : "volumen promedio"}.
          </p>
        </div>
        <div className="heatmap-controls">
          <button
            onClick={() => setColorMode("conversion")}
            className={`heatmap-toggle-button ${colorMode === "conversion" ? "active" : ""}`}
          >
            Conversión
          </button>
          <button
            onClick={() => setColorMode("volume")}
            className={`heatmap-toggle-button ${colorMode === "volume" ? "active" : ""}`}
          >
            Volumen
          </button>
        </div>
      </div>

      <div className="heatmap-scroll-container">
        <div
          className="heatmap-grid"
          style={{
            gridTemplateColumns: `150px repeat(${data.painPoints.length}, minmax(120px, 1fr))`,
          }}
        >
          <div className="heatmap-header-cell">
            Industria / Pain Point
          </div>

          {data.painPoints.map((pp) => (
            <div
              key={pp}
              className="heatmap-column-header"
              title={PainPointsLabels[pp as PainPoints] || pp}
            >
              {PainPointsLabels[pp as PainPoints] || pp}
            </div>
          ))}

          {data.industries.map((industry) => (
            <React.Fragment key={industry}>
              <div
                className="heatmap-row-header"
                title={IndustryLabels[industry as Industry] || industry}
              >
                {IndustryLabels[industry as Industry] || industry}
              </div>

              {data.painPoints.map((pp) => {
                const cell = getCellData(industry, pp);
                return (
                  <div
                    key={`${industry}-${pp}`}
                    className={`heatmap-cell ${cell ? 'filled' : ''}`}
                    style={{
                      background: getColor(cell),
                    }}
                    title={
                      cell
                        ? `${IndustryLabels[industry as Industry] || industry} × ${PainPointsLabels[pp as PainPoints] || pp}\nTotal: ${cell.total}\nCerrados: ${cell.closed}\nConversión: ${cell.conversionRate.toFixed(1)}%\nVolumen Promedio: ${cell.avgVolume}`
                        : "Sin datos"
                    }
                  >
                    {cell && (
                      <div className="heatmap-cell-content">
                        <div
                          className="heatmap-cell-dot"
                          style={{
                            width: getCellSize(cell),
                            height: getCellSize(cell),
                          }}
                        >
                          {cell.total}
                        </div>
                        <div className="heatmap-cell-rate">
                          {colorMode === "conversion"
                            ? `${cell.conversionRate.toFixed(0)}%`
                            : `${cell.avgVolume}`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <div className="heatmap-legend-content">
          <div className="heatmap-legend-item">
            <strong>Leyenda:</strong>
          </div>
          <div className="heatmap-legend-item">
            <span className="heatmap-legend-color heatmap-legend-color-low" />
            Baja {colorMode === "conversion" ? "conversión" : "volumen"}
          </div>
          <div className="heatmap-legend-item">
            <span className="heatmap-legend-color heatmap-legend-color-high" />
            Alta {colorMode === "conversion" ? "conversión" : "volumen"}
          </div>
          <div className="heatmap-legend-item">
            <span className="heatmap-legend-dot" />
            Tamaño = Cantidad de leads
          </div>
        </div>
      </div>
    </div>
  );
}
