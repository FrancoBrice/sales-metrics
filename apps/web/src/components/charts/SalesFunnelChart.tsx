"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { LeadSourceLabels, JtbdPrimaryLabels, IndustryLabels, LeadSource, JtbdPrimary, Industry } from "@vambe/shared";
import { Loading, EmptyStateWithType } from "@/components/ui/Loading";
import { Card } from "@/components/ui/Card";

interface SalesFunnelChartProps {
  filters?: { seller?: string; dateFrom?: string; dateTo?: string };
}

interface StageData {
  name: string;
  total: number;
  closed: number;
  conversionRate: number;
  progressionRate?: number;
  breakdown: {
    byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }>;
    byJTBD: Record<string, { total: number; closed: number; conversionRate: number }>;
    byIndustry: Record<string, { total: number; closed: number; conversionRate: number }>;
  };
  topPerformers: string[];
  dropOffRate: number;
}

interface FunnelData {
  stages: StageData[];
  trends: {
    conversionTrend: Array<{ period: string; conversionRate: number }>;
    leadSourceEvolution: Record<string, Array<{ period: string; count: number }>>;
  };
}

interface InsightsData {
  bottlenecks: string[];
  opportunities: string[];
  recommendations: string[];
}

export function SalesFunnelChart({ filters }: SalesFunnelChartProps) {
  const [data, setData] = useState<FunnelData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [breakdownType, setBreakdownType] = useState<"leadSource" | "jtbd" | "industry">("leadSource");

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    setInsights(null);
    try {
      const funnelData = await api.metrics.salesFunnelEnhanced(filters);
      setData(funnelData);
      setLoading(false);
      loadInsights();
    } catch (error) {
      console.error("Error loading sales funnel:", error);
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
    return <EmptyStateWithType type="error" message="Error al cargar el embudo de ventas" />;
  }

  if (data.stages.length === 0) {
    return <EmptyStateWithType type="empty" message="No hay datos disponibles para el embudo de ventas" />;
  }

  const maxTotal = Math.max(...data.stages.map((s) => s.total), 1);

  const getStageColor = (index: number) => {
    const colors = [
      "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      "linear-gradient(135deg, #6366f1 0%, #5b21b6 100%)",
      "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
      "linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)",
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    ];
    return colors[index % colors.length];
  };

  const getStageName = (name: string): string => {
    const stageNames: Record<string, string> = {
      "Lead Generation": "Generación de Leads",
      "Qualification": "Calificación",
      "Needs Assessment": "Análisis de Necesidades",
      "Proposal Development": "Desarrollo de Propuesta",
      "Closure": "Cierre",
    };
    return stageNames[name] || name;
  };

  const getBreakdownLabel = (key: string, type: "leadSource" | "jtbd" | "industry") => {
    switch (type) {
      case "leadSource":
        return LeadSourceLabels[key as LeadSource] || key;
      case "jtbd":
        return JtbdPrimaryLabels[key as JtbdPrimary] || key;
      case "industry":
        return IndustryLabels[key as Industry] || key;
      default:
        return key;
    }
  };

  const calculateFunnelWidth = (index: number, totalStages: number) => {
    const baseWidth = 100;
    const reductionPerStage = 15;
    const currentWidth = baseWidth - (index * reductionPerStage);
    return Math.max(30, currentWidth);
  };

  return (
    <div className="sales-funnel-container">
      <Card>
        <div className="funnel-chart-wrapper">
          <div className="funnel-chart">
            {data.stages.map((stage, index) => {
              const isExpanded = expandedStage === stage.name;
              const isFirst = index === 0;
              const isLast = index === data.stages.length - 1;
              const previousStage = index > 0 ? data.stages[index - 1] : null;
              const currentWidth = calculateFunnelWidth(index, data.stages.length);
              const previousWidth = previousStage ? calculateFunnelWidth(index - 1, data.stages.length) : 100;
              const closedPercentage = stage.total > 0 ? (stage.closed / stage.total) * 100 : 0;

              return (
                <div key={stage.name} className="funnel-segment-wrapper">
                  <div
                    className={`funnel-segment ${isExpanded ? "expanded" : ""} ${isFirst ? "first" : ""} ${isLast ? "last" : ""}`}
                    style={{
                      width: `${currentWidth}%`,
                      background: getStageColor(index),
                      "--stage-index": index,
                    } as React.CSSProperties}
                    onClick={() => setExpandedStage(isExpanded ? null : stage.name)}
                  >
                    <div className="funnel-segment-closed" style={{ width: `${closedPercentage}%` }} />
                    <div className="funnel-segment-content">
                      <div className="funnel-segment-label">{getStageName(stage.name)}</div>
                      <div className="funnel-segment-percentage">
                        {stage.conversionRate.toFixed(1)}%
                      </div>
                      <div className="funnel-segment-count">{stage.total}</div>
                    </div>
                    <button
                      className="funnel-segment-expand"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedStage(isExpanded ? null : stage.name);
                      }}
                      aria-label={isExpanded ? "Contraer" : "Expandir"}
                    >
                      {isExpanded ? "−" : "+"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="funnel-breakdown-panel">
                      <div className="breakdown-header">
                        <div className="breakdown-tabs">
                          <button
                            className={`breakdown-tab ${breakdownType === "leadSource" ? "active" : ""}`}
                            onClick={() => setBreakdownType("leadSource")}
                          >
                            Por Fuente
                          </button>
                          <button
                            className={`breakdown-tab ${breakdownType === "jtbd" ? "active" : ""}`}
                            onClick={() => setBreakdownType("jtbd")}
                          >
                            Por JTBD
                          </button>
                          <button
                            className={`breakdown-tab ${breakdownType === "industry" ? "active" : ""}`}
                            onClick={() => setBreakdownType("industry")}
                          >
                            Por Industria
                          </button>
                        </div>
                        <div className="breakdown-metrics">
                          <span className="breakdown-metric">
                            <strong>{stage.total}</strong> total
                          </span>
                          <span className="breakdown-metric">
                            <strong>{stage.closed}</strong> cerrados
                          </span>
                          <span className="breakdown-metric highlight">
                            <strong>{stage.conversionRate.toFixed(1)}%</strong> conversión
                          </span>
                          {stage.dropOffRate > 0 && (
                            <span className="breakdown-metric warning">
                              <strong>{stage.dropOffRate.toFixed(1)}%</strong> pérdida
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="breakdown-content">
                        {(() => {
                          const breakdownKey = breakdownType === "leadSource" ? "byLeadSource" : breakdownType === "jtbd" ? "byJTBD" : "byIndustry";
                          const breakdownData = stage.breakdown[breakdownKey as keyof typeof stage.breakdown] as Record<string, { total: number; closed: number; conversionRate: number }>;
                          const entries = Object.entries(breakdownData || {});

                          if (entries.length === 0) {
                            return <p className="breakdown-empty">No hay datos disponibles para esta dimensión</p>;
                          }

                          return (
                            <div className="breakdown-list">
                              {entries
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([key, stats]) => (
                                  <div key={key} className="breakdown-item">
                                    <div className="breakdown-item-label">
                                      {getBreakdownLabel(key, breakdownType)}
                                    </div>
                                    <div className="breakdown-item-stats">
                                      <span className="breakdown-stat">
                                        {stats.total} total
                                      </span>
                                      <span className="breakdown-stat">
                                        {stats.closed} cerrados
                                      </span>
                                      <span className="breakdown-stat highlight">
                                        {stats.conversionRate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="breakdown-bar">
                                      <div
                                        className="breakdown-bar-fill"
                                        style={{
                                          width: `${(stats.total / maxTotal) * 100}%`,
                                          background: getStageColor(index),
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          );
                        })()}
                      </div>

                      {stage.topPerformers.length > 0 && (
                        <div className="top-performers">
                          <h4>Mejores Performers:</h4>
                          <div className="top-performers-list">
                            {stage.topPerformers.map((performer) => (
                              <span key={performer} className="badge badge-success">
                                {getBreakdownLabel(performer, "leadSource")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="funnel-insights">
        <Card>
          <h3 className="section-title">Insights y Recomendaciones</h3>

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
            </>
          )}

          {!loadingInsights && !insights && (
            <div className="insights-error">
              <p>No se pudieron cargar los insights. Intenta recargar la página.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
