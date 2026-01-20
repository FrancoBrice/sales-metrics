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
import { ModalOverlay } from "./ModalOverlay";
import { ModalContent } from "./ModalContent";
import { ModalCloseButton } from "./ModalCloseButton";
import { getLabel } from "./helpers";

interface SellerProfileModalProps {
  seller: string;
  onClose: () => void;
  filters?: { dateFrom?: string; dateTo?: string };
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
      <ModalOverlay onClose={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent size="large" onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClose={onClose} />

        <div style={{ paddingRight: "3rem" }}>
          <h2 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>{data.seller}</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <span className={`badge ${data.conversionRate >= 50 ? "badge-success" : data.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
              {data.conversionRate.toFixed(1)}% Conversión
            </span>
            <span className="badge badge-info">
              {data.closed}/{data.total} Cerradas
            </span>
          </div>
        </div>

        <div className="modal-body" style={{ paddingRight: "3rem" }}>
          <div className="metrics-grid" style={{ marginBottom: "2.5rem", gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="metric-card" style={{ padding: "1.5rem" }}>
              <div className="metric-value" style={{ fontSize: "2.5rem" }}>{data.total}</div>
              <div className="metric-label">Total Oportunidades</div>
            </div>
            <div className="metric-card" style={{ padding: "1.5rem" }}>
              <div className="metric-value" style={{ fontSize: "2.5rem" }}>{data.closed}</div>
              <div className="metric-label">Ventas Cerradas</div>
            </div>
            <div className="metric-card" style={{ padding: "1.5rem" }}>
              <div className="metric-value" style={{ fontSize: "2.5rem" }}>{data.conversionRate.toFixed(1)}%</div>
              <div className="metric-label">Tasa de Conversión</div>
            </div>
          </div>

          <div className="modal-section card" style={{ padding: "1.5rem", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
            <h3 className="section-title" style={{ marginBottom: "1.25rem" }}>Distribución de Sentimientos</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
              {data.sentimentDistribution.map((sentiment) => {
                const sentimentColor =
                  sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                  sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" :
                  "var(--color-warning)";

                return (
                  <div key={sentiment.sentiment} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: sentimentColor
                    }}></span>
                    <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
                      {getLabel(SentimentLabels, sentiment.sentiment)}:
                    </span>
                    <span style={{ color: "var(--color-text)", fontWeight: 600, fontSize: "1.1rem" }}>
                      {sentiment.total}
                    </span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                      ({sentiment.conversionRate.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {data.topIndustries.length > 0 && (
              <div className="card" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
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
                        <div className="bar-container" style={{ background: "var(--color-surface)" }}>
                          <div className="bar-fill" style={{ width: `${width}%` }} />
                        </div>
                        <div className="bar-value">
                          {industry.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.topLeadSources.length > 0 && (
              <div className="card" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
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
                        <div className="bar-container" style={{ background: "var(--color-surface)" }}>
                          <div className="bar-fill" style={{ width: `${width}%` }} />
                        </div>
                        <div className="bar-value">
                          {source.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {data.topPainPoints.length > 0 && (
            <div className="card" style={{ marginTop: "1.5rem", background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
              <h3 className="section-title">Top Pain Points</h3>
              <div className="tag-list">
                {data.topPainPoints.map((pp) => (
                  <span key={pp.painPoint} className="tag" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", background: "var(--color-surface)" }}>
                    {getLabel(PainPointsLabels, pp.painPoint)}
                    <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>({pp.total})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
            {data.urgencyBreakdown.length > 0 && (
              <div className="card" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
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
                        <div className="bar-container" style={{ background: "var(--color-surface)" }}>
                          <div className="bar-fill" style={{ width: `${width}%`, background: "var(--color-primary)" }} />
                        </div>
                        <div className="bar-value">
                          {urgency.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.riskBreakdown.length > 0 && (
              <div className="card" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
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
                        <div className="bar-container" style={{ background: "var(--color-surface)" }}>
                          <div className="bar-fill" style={{ width: `${width}%`, background: "var(--color-secondary)" }} />
                        </div>
                        <div className="bar-value">
                          {risk.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
}
