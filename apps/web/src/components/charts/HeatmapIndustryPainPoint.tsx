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
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: "0.5rem" }}>
            Matriz Industria × Pain Point
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Visualiza la relación entre industrias y pain points. El tamaño indica volumen, el color indica{" "}
            {colorMode === "conversion" ? "tasa de conversión" : "volumen promedio"}.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setColorMode("conversion")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `2px solid ${colorMode === "conversion" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: colorMode === "conversion" ? "var(--color-primary)" : "var(--color-surface-elevated)",
              color: colorMode === "conversion" ? "white" : "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: colorMode === "conversion" ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Conversión
          </button>
          <button
            onClick={() => setColorMode("volume")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `2px solid ${colorMode === "volume" ? "var(--color-primary)" : "var(--color-border)"}`,
              background: colorMode === "volume" ? "var(--color-primary)" : "var(--color-surface-elevated)",
              color: colorMode === "volume" ? "white" : "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: colorMode === "volume" ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Volumen
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "600px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `150px repeat(${data.painPoints.length}, minmax(120px, 1fr))`,
            gap: "0.5rem",
            minWidth: "fit-content",
          }}
        >
          <div
            style={{
              position: "sticky",
              left: 0,
              zIndex: 10,
              background: "var(--color-surface)",
              padding: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderRight: "2px solid var(--color-border)",
            }}
          >
            Industria / Pain Point
          </div>

          {data.painPoints.map((pp) => (
            <div
              key={pp}
              style={{
                padding: "0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                borderBottom: "2px solid var(--color-border)",
              }}
              title={PainPointsLabels[pp as PainPoints] || pp}
            >
              {PainPointsLabels[pp as PainPoints] || pp}
            </div>
          ))}

          {data.industries.map((industry) => (
            <React.Fragment key={industry}>
              <div
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 5,
                  background: "var(--color-surface)",
                  padding: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  borderRight: "2px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                }}
                title={IndustryLabels[industry as Industry] || industry}
              >
                {IndustryLabels[industry as Industry] || industry}
              </div>

              {data.painPoints.map((pp) => {
                const cell = getCellData(industry, pp);
                return (
                  <div
                    key={`${industry}-${pp}`}
                    style={{
                      background: getColor(cell),
                      borderRadius: "6px",
                      padding: "0.75rem",
                      minHeight: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.25rem",
                      cursor: cell ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      border: cell ? "1px solid var(--color-border)" : "1px dashed var(--color-border)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (cell) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.zIndex = "20";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (cell) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.zIndex = "1";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                    title={
                      cell
                        ? `${IndustryLabels[industry as Industry] || industry} × ${PainPointsLabels[pp as PainPoints] || pp}\nTotal: ${cell.total}\nCerrados: ${cell.closed}\nConversión: ${cell.conversionRate.toFixed(1)}%\nVolumen Promedio: ${cell.avgVolume}`
                        : "Sin datos"
                    }
                  >
                    {cell && (
                      <>
                        <div
                          style={{
                            width: getCellSize(cell),
                            height: getCellSize(cell),
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--color-text)",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {cell.total}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: "rgba(255, 255, 255, 0.95)",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {colorMode === "conversion"
                            ? `${cell.conversionRate.toFixed(0)}%`
                            : `${cell.avgVolume}`}
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
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <strong style={{ color: "var(--color-text)" }}>Leyenda:</strong>
          </div>
          <div>
            <span style={{ display: "inline-block", width: "12px", height: "12px", background: "rgba(239, 68, 68, 0.5)", borderRadius: "3px", marginRight: "0.5rem" }} />
            Baja {colorMode === "conversion" ? "conversión" : "volumen"}
          </div>
          <div>
            <span style={{ display: "inline-block", width: "12px", height: "12px", background: "rgba(34, 197, 94, 0.8)", borderRadius: "3px", marginRight: "0.5rem" }} />
            Alta {colorMode === "conversion" ? "conversión" : "volumen"}
          </div>
          <div>
            <span style={{ display: "inline-block", width: "8px", height: "8px", background: "white", borderRadius: "50%", marginRight: "0.5rem", boxShadow: "0 0 0 2px var(--color-border)" }} />
            Tamaño = Cantidad de leads
          </div>
        </div>
      </div>
    </div>
  );
}
