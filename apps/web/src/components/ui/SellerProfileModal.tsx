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

        <div className="seller-profile-header">
          <h2>{data.seller}</h2>
          <div className="seller-profile-badges">
            <span className={`badge ${data.conversionRate >= 50 ? "badge-success" : data.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
              {data.conversionRate.toFixed(1)}% Conversión
            </span>
            <span className="badge badge-info">
              {data.closed}/{data.total} Cerradas
            </span>
          </div>
        </div>

        <div className="seller-profile-body">
          <div className="metrics-grid seller-profile-metrics-grid">
            <div className="metric-card seller-profile-metric-card">
              <div className="metric-value seller-profile-metric-value">{data.total}</div>
              <div className="metric-label">Total Oportunidades</div>
            </div>
            <div className="metric-card seller-profile-metric-card">
              <div className="metric-value seller-profile-metric-value">{data.closed}</div>
              <div className="metric-label">Ventas Cerradas</div>
            </div>
            <div className="metric-card seller-profile-metric-card">
              <div className="metric-value seller-profile-metric-value">{data.conversionRate.toFixed(1)}%</div>
              <div className="metric-label">Tasa de Conversión</div>
            </div>
          </div>

          <div className="modal-section card seller-profile-sentiment-section">
            <h3 className="section-title seller-profile-sentiment-title">Distribución de Sentimientos</h3>
            <div className="seller-profile-sentiment-distribution">
              {data.sentimentDistribution.map((sentiment) => {
                const sentimentColor =
                  sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                  sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" :
                  "var(--color-warning)";

                return (
                  <div key={sentiment.sentiment} className="seller-profile-sentiment-item">
                    <span
                      className="seller-profile-sentiment-dot"
                      style={{ background: sentimentColor }}
                    ></span>
                    <span className="seller-profile-sentiment-label">
                      {getLabel(SentimentLabels, sentiment.sentiment)}:
                    </span>
                    <span className="seller-profile-sentiment-value">
                      {sentiment.total}
                    </span>
                    <span className="seller-profile-sentiment-percentage">
                      ({sentiment.conversionRate.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="seller-profile-grid">
            {data.topIndustries.length > 0 && (
              <div className="card seller-profile-card">
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
                          {industry.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.topLeadSources.length > 0 && (
              <div className="card seller-profile-card">
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
            <div className="card seller-profile-card" style={{ marginTop: "1.5rem" }}>
              <h3 className="section-title">Top Pain Points</h3>
              <div className="tag-list">
                {data.topPainPoints.map((pp) => (
                  <span key={pp.painPoint} className="tag">
                    {getLabel(PainPointsLabels, pp.painPoint)}
                    <span>({pp.total})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="seller-profile-grid" style={{ marginTop: "1.5rem" }}>
            {data.urgencyBreakdown.length > 0 && (
              <div className="card seller-profile-card">
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
              <div className="card seller-profile-card">
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
