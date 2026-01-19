"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  IndustryLabels,
  LeadSourceLabels,
  PainPointsLabels,
  UrgencyLabels,
  RiskLevelLabels,
  SentimentLabels,
  Industry,
  LeadSource,
  PainPoints,
  Urgency,
  RiskLevel,
  Sentiment,
} from "@vambe/shared";

interface SellerProfileModalProps {
  seller: string;
  onClose: () => void;
  filters?: { dateFrom?: string; dateTo?: string };
}

function getLabel<T extends string>(
  labels: Record<T, string>,
  value: string | null | undefined
): string {
  if (!value) return "-";
  return labels[value as T] || value;
}

export function SellerProfileModal({ seller, onClose, filters }: SellerProfileModalProps) {
  const [data, setData] = useState<{
    seller: string;
    total: number;
    closed: number;
    conversionRate: number;
    avgVolume: number | null;
    sentimentDistribution: Array<{
      sentiment: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    topIndustries: Array<{
      industry: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    topLeadSources: Array<{
      source: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    topPainPoints: Array<{
      painPoint: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    urgencyBreakdown: Array<{
      urgency: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
    riskBreakdown: Array<{
      riskLevel: string;
      total: number;
      closed: number;
      conversionRate: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerData();
  }, [seller, filters]);

  async function loadSellerData() {
    setLoading(true);
    try {
      const result = await api.metrics.sellerDetails(seller, filters);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className="modal-overlay"
        onClick={onClose}
      >
        <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const maxSentiment = Math.max(...data.sentimentDistribution.map((s) => s.total), 1);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="card modal-content modal-content-large"
        style={{
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "1.5rem",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-elevated)";
            e.currentTarget.style.color = "var(--color-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          ×
        </button>

        <div style={{ paddingRight: "3rem", marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.75rem" }}>{data.seller}</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className={`badge ${data.conversionRate >= 50 ? "badge-success" : data.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
              {data.conversionRate.toFixed(1)}% Conversión
            </span>
            <span className="badge badge-info">
              {data.closed}/{data.total} Cerradas
            </span>
          </div>
        </div>

        <div className="metrics-grid" style={{ marginBottom: "2rem" }}>
          <div className="metric-card">
            <div className="metric-value">{data.total}</div>
            <div className="metric-label">Total Oportunidades</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.closed}</div>
            <div className="metric-label">Ventas Cerradas</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.conversionRate.toFixed(1)}%</div>
            <div className="metric-label">Tasa de Conversión</div>
          </div>
          {data.avgVolume !== null && (
            <div className="metric-card">
              <div className="metric-value">{data.avgVolume}</div>
              <div className="metric-label">Volumen Promedio</div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-elevated)" }}>
          <h3 className="section-title">Distribución de Sentimientos</h3>
          <div className="bar-chart">
            {data.sentimentDistribution.map((sentiment) => {
              const width = (sentiment.total / maxSentiment) * 100;
              const sentimentColor =
                sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" :
                "var(--color-warning)";

              return (
                <div key={sentiment.sentiment} className="bar-item">
                  <div className="bar-label">
                    {getLabel(SentimentLabels, sentiment.sentiment)}
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${sentimentColor} 0%, ${sentimentColor}dd 100%)`,
                      }}
                    />
                  </div>
                  <div className="bar-value">
                    {sentiment.total} ({sentiment.conversionRate.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {data.topIndustries.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-elevated)" }}>
            <h3 className="section-title">Top Industrias</h3>
            <div className="bar-chart">
              {data.topIndustries.map((industry) => {
                const maxIndustry = Math.max(...data.topIndustries.map((i) => i.total), 1);
                const width = (industry.total / maxIndustry) * 100;

                return (
                  <div key={industry.industry} className="bar-item">
                    <div className="bar-label">
                      {getLabel(IndustryLabels, industry.industry)}
                    </div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${width}%` }} />
                    </div>
                    <div className="bar-value">
                      {industry.total} ({industry.conversionRate.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.topLeadSources.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-elevated)" }}>
            <h3 className="section-title">Top Fuentes de Leads</h3>
            <div className="bar-chart">
              {data.topLeadSources.map((source) => {
                const maxSource = Math.max(...data.topLeadSources.map((s) => s.total), 1);
                const width = (source.total / maxSource) * 100;

                return (
                  <div key={source.source} className="bar-item">
                    <div className="bar-label">
                      {getLabel(LeadSourceLabels, source.source)}
                    </div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${width}%` }} />
                    </div>
                    <div className="bar-value">
                      {source.total} ({source.conversionRate.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.topPainPoints.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-elevated)" }}>
            <h3 className="section-title">Top Pain Points</h3>
            <div className="tag-list">
              {data.topPainPoints.map((pp) => (
                <span key={pp.painPoint} className="tag" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                  {getLabel(PainPointsLabels, pp.painPoint)} ({pp.total}, {pp.conversionRate.toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {data.urgencyBreakdown.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-elevated)" }}>
            <h3 className="section-title">Desglose por Urgencia</h3>
            <div className="bar-chart">
              {data.urgencyBreakdown.map((urgency) => {
                const maxUrgency = Math.max(...data.urgencyBreakdown.map((u) => u.total), 1);
                const width = (urgency.total / maxUrgency) * 100;

                return (
                  <div key={urgency.urgency} className="bar-item">
                    <div className="bar-label">
                      {getLabel(UrgencyLabels, urgency.urgency)}
                    </div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${width}%` }} />
                    </div>
                    <div className="bar-value">
                      {urgency.total} ({urgency.conversionRate.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.riskBreakdown.length > 0 && (
          <div className="card" style={{ background: "var(--color-surface-elevated)" }}>
            <h3 className="section-title">Desglose por Nivel de Riesgo</h3>
            <div className="bar-chart">
              {data.riskBreakdown.map((risk) => {
                const maxRisk = Math.max(...data.riskBreakdown.map((r) => r.total), 1);
                const width = (risk.total / maxRisk) * 100;

                return (
                  <div key={risk.riskLevel} className="bar-item">
                    <div className="bar-label">
                      {getLabel(RiskLevelLabels, risk.riskLevel)}
                    </div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${width}%` }} />
                    </div>
                    <div className="bar-value">
                      {risk.total} ({risk.conversionRate.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
