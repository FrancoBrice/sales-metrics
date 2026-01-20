"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { LeadSourceLabels, JtbdPrimaryLabels, IndustryLabels, PainPointsLabels, LeadSource, JtbdPrimary, Industry, PainPoints } from "@vambe/shared";
import { Loading, EmptyStateWithType, EmptyState } from "@/components/ui/Loading";
import { Card } from "@/components/ui/Card";
import { Button, ButtonVariant } from "@/components/ui/Button";
import { performanceColors } from "@/constants/colors";
import "@/styles/charts/closure-analysis.css";

interface ClosureAnalysisChartProps {
  filters?: { seller?: string; dateFrom?: string; dateTo?: string };
}

interface InsightsData {
  bottlenecks: string[];
  opportunities: string[];
  recommendations: string[];
  dataQuality?: {
    topPerformers: Array<{ category: string; total: number; closed: number; conversionRate: number }>;
    underperformers: Array<{ category: string; total: number; closed: number; conversionRate: number }>;
    significantFindings: Array<{ category: string; dimension: string; significance: string; reasoning: string }>;
  };
}

interface CategoryStats {
  category: string;
  total: number;
  closed: number;
  conversionRate: number;
  confidence: number;
  volume: number;
}

interface ClosureAnalysisData {
  byLeadSource: CategoryStats[];
  byIndustry: CategoryStats[];
  byJTBD: CategoryStats[];
  byPainPoint: CategoryStats[];
  bySeller: CategoryStats[];
  overall: {
    total: number;
    closed: number;
    conversionRate: number;
  };
  insights: {
    topPerformers: CategoryStats[];
    underperformers: CategoryStats[];
    highVolumeOpportunities: CategoryStats[];
    statisticalSignificance: Array<{
      category: string;
      dimension: string;
      significance: "high" | "medium" | "low";
      reasoning: string;
    }>;
  };
}

type Dimension = "leadSource" | "industry" | "jtbd" | "painPoint" | "seller";

export function ClosureAnalysisChart({ filters }: ClosureAnalysisChartProps) {
  const [data, setData] = useState<ClosureAnalysisData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension>("leadSource");
  const [sortBy, setSortBy] = useState<"total" | "conversionRate" | "volume">("total");

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    setInsights(null);
    setLoadingInsights(false);
    try {
      const analysisData = await api.metrics.closureAnalysis(filters);
      setData(analysisData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading closure analysis:", error);
      setData(null);
      setLoading(false);
    }
  }

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const insightsData = await api.metrics.salesFunnelInsights(filters);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error loading insights:", error);
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!data) {
    return <EmptyState title="Error al cargar" message="Error al cargar el análisis de cierres" />;
  }

  const getDimensionData = (dim: Dimension): CategoryStats[] => {
    switch (dim) {
      case "leadSource":
        return data.byLeadSource;
      case "industry":
        return data.byIndustry;
      case "jtbd":
        return data.byJTBD;
      case "painPoint":
        return data.byPainPoint;
      case "seller":
        return data.bySeller;
      default:
        return [];
    }
  };

  const getDimensionLabel = (dim: Dimension): string => {
    const labels: Record<Dimension, string> = {
      leadSource: "Fuente de Lead",
      industry: "Industria",
      jtbd: "JTBD",
      painPoint: "Pain Point",
      seller: "Vendedor",
    };
    return labels[dim];
  };

  const getCategoryLabel = (category: string, dim: Dimension): string => {
    switch (dim) {
      case "leadSource":
        return LeadSourceLabels[category as LeadSource] || category;
      case "industry":
        return IndustryLabels[category as Industry] || category;
      case "jtbd":
        return JtbdPrimaryLabels[category as JtbdPrimary] || category;
      case "painPoint":
        return PainPointsLabels[category as PainPoints] || category;
      default:
        return category;
    }
  };

  const dimensionData = getDimensionData(selectedDimension);
  const sortedData = [...dimensionData].sort((a, b) => {
    switch (sortBy) {
      case "conversionRate":
        return b.conversionRate - a.conversionRate;
      case "volume":
        return b.volume - a.volume;
      case "total":
      default:
        return b.total - a.total;
    }
  });

  const maxTotal = Math.max(...sortedData.map((d) => d.total), 1);
  const overallRate = data.overall.conversionRate;

  const getConversionColor = (rate: number): string => {
    const diff = rate - overallRate;
    if (diff > 15) return performanceColors.excellent;
    if (diff > 5) return performanceColors.good;
    if (diff > -5) return performanceColors.neutral;
    if (diff > -15) return performanceColors.warning;
    return performanceColors.poor;
  };

  return (
    <div className="closure-analysis-container">
      <div className="closure-insights">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>Insights y Recomendaciones</h3>
            <Button
              variant={insights ? ButtonVariant.Secondary : ButtonVariant.Primary}
              onClick={loadInsights}
              disabled={loadingInsights}
            >
              {loadingInsights ? "Generando..." : insights ? "Regenerar Insights con IA" : "Generar Insights con IA"}
            </Button>
          </div>

          {loadingInsights && (
            <div className="insights-loading">
              <div className="spinner"></div>
              <p className="insights-loading-message">Generando insights relevantes con IA...</p>
            </div>
          )}

          {!loadingInsights && insights && (
            <>
              {insights.bottlenecks.length > 0 && (
                <div className="insight-section">
                  <h4 className="insight-title bottleneck">Cuellos de Botella</h4>
                  <ul className="insight-list">
                    {insights.bottlenecks.map((bottleneck, idx) => (
                      <li key={idx}>{bottleneck}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.opportunities.length > 0 && (
                <div className="insight-section">
                  <h4 className="insight-title opportunity">Oportunidades</h4>
                  <ul className="insight-list">
                    {insights.opportunities.map((opportunity, idx) => (
                      <li key={idx}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.recommendations.length > 0 && (
                <div className="insight-section">
                  <h4 className="insight-title recommendation">Recomendaciones</h4>
                  <ul className="insight-list">
                    {insights.recommendations.map((recommendation, idx) => (
                      <li key={idx}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.dataQuality && insights.dataQuality.significantFindings.length > 0 && (
                <div className="insight-section">
                  <h4 className="insight-title">Hallazgos Estadísticos Significativos</h4>
                  <ul className="insight-list">
                    {insights.dataQuality.significantFindings.slice(0, 5).map((finding, idx) => (
                      <li key={idx}>
                        <strong>{finding.category}</strong> ({finding.dimension}): {finding.significance} - {finding.reasoning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!loadingInsights && !insights && (
            <div className="insights-empty">
              <p>Haz clic en "Generar Insights con IA" para obtener análisis y recomendaciones basados en tus datos.</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="closure-header">
          <div>
            <h3 className="section-title">Análisis de Cierres por Categoría</h3>
            <div className="overall-stats">
              <span className="stat-item">
                <strong>{data.overall.total}</strong> total
              </span>
              <span className="stat-item">
                <strong>{data.overall.closed}</strong> cerrados
              </span>
              <span className="stat-item highlight">
                <strong>{data.overall.conversionRate.toFixed(1)}%</strong> conversión promedio
              </span>
            </div>
          </div>
        </div>

        <div className="dimension-selector">
          <div className="dimension-tabs">
            {(["leadSource", "industry", "jtbd", "painPoint", "seller"] as Dimension[]).map((dim) => (
              <button
                key={dim}
                className={`dimension-tab ${selectedDimension === dim ? "active" : ""}`}
                onClick={() => setSelectedDimension(dim)}
              >
                {getDimensionLabel(dim)}
              </button>
            ))}
          </div>

          <div className="sort-selector">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="total">Total</option>
              <option value="conversionRate">Tasa de Conversión</option>
              <option value="volume">Volumen</option>
            </select>
          </div>
        </div>

        <div className="closure-chart">
          {sortedData.length === 0 ? (
            <EmptyState title="No hay datos disponibles" message={`No hay datos disponibles para ${getDimensionLabel(selectedDimension)}`} />
          ) : (
            sortedData.map((item) => {
              const conversionColor = getConversionColor(item.conversionRate);
              const isBetter = item.conversionRate > overallRate + 5;
              const isWorse = item.conversionRate < overallRate - 5;
              const diff = item.conversionRate - overallRate;

              return (
                <div key={item.category} className="closure-item">
                  <div className="closure-item-header">
                    <span className="closure-category">{getCategoryLabel(item.category, selectedDimension)}</span>
                    <div className="closure-badges">
                      {item.confidence >= 80 && (
                        <span className="badge badge-confidence" title={`Confianza estadística: ${item.confidence}%`}>
                          ✓
                        </span>
                      )}
                      {isBetter && <span className="badge badge-success">↑</span>}
                      {isWorse && <span className="badge badge-warning">↓</span>}
                    </div>
                  </div>

                  <div className="closure-bar-container">
                    <div className="closure-bar-total" style={{ width: `${(item.total / maxTotal) * 100}%` }}>
                      <div
                        className="closure-bar-closed"
                        style={{
                          width: `${(item.closed / item.total) * 100}%`,
                          backgroundColor: conversionColor,
                        }}
                      />
                    </div>
                  </div>

                  <div className="closure-stats">
                    <span className="closure-stat">
                      <strong>{item.total}</strong> total
                    </span>
                    <span className="closure-stat">
                      <strong>{item.closed}</strong> cerrados
                    </span>
                    <span
                      className="closure-stat highlight"
                      style={{ color: conversionColor }}
                    >
                      <strong>{item.conversionRate.toFixed(1)}%</strong> conversión
                    </span>
                    {diff !== 0 && (
                      <span className={`closure-stat ${isBetter ? "positive" : isWorse ? "negative" : ""}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}% vs promedio
                      </span>
                    )}
                    {item.volume > 0 && (
                      <span className="closure-stat">
                        Volumen: <strong>{item.volume}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {data.insights.topPerformers.length > 0 && (
          <div className="insights-summary">
            <h4 className="insights-title">Top Performers</h4>
            <div className="insights-list">
              {data.insights.topPerformers.slice(0, 3).map((performer) => (
                <div key={performer.category} className="insight-item">
                  <strong>{performer.category}</strong>: {performer.conversionRate.toFixed(1)}% conversión
                  ({performer.closed}/{performer.total})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
