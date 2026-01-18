"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  IndustryLabels,
  BusinessModelLabels,
  JtbdPrimaryLabels,
  PainPointsLabels,
  LeadSourceLabels,
  ProcessMaturityLabels,
  ToolingMaturityLabels,
  KnowledgeComplexityLabels,
  RiskLevelLabels,
  IntegrationsLabels,
  UrgencyLabels,
  SuccessMetricLabels,
  ObjectionsLabels,
  SentimentLabels,
  VolumeUnitLabels,
  Industry,
  BusinessModel,
  JtbdPrimary,
  PainPoints,
  LeadSource,
  ProcessMaturity,
  ToolingMaturity,
  KnowledgeComplexity,
  RiskLevel,
  Integrations,
  Urgency,
  SuccessMetric,
  Objections,
  Sentiment,
  VolumeUnit,
} from "@vambe/shared";

interface CustomerProfileModalProps {
  customerId: string;
  onClose: () => void;
}

function getLabel<T extends string>(
  labels: Record<T, string>,
  value: string | null | undefined
): string {
  if (!value) return "-";
  return labels[value as T] || value;
}

export function CustomerProfileModal({ customerId, onClose }: CustomerProfileModalProps) {
  const [customer, setCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    seller: string;
    meetingDate: string;
    closed: boolean;
    createdAt: string;
    meetingId: string | null;
    transcript: string | null;
    extraction: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  async function loadCustomer() {
    setLoading(true);
    try {
      const data = await api.customers.getById(customerId);
      setCustomer(data);
    } catch (error) {
      console.error("Failed to load customer details", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div className="card" style={{ maxWidth: "800px", width: "90%", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const extraction = customer.extraction;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card"
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

        <div style={{ paddingRight: "3rem" }}>
          <h2 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>{customer.name}</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Email: </span>
              <span style={{ fontSize: "0.875rem" }}>{customer.email}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Teléfono: </span>
              <span style={{ fontSize: "0.875rem" }}>{customer.phone}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Vendedor: </span>
              <span style={{ fontSize: "0.875rem" }}>{customer.seller}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Fecha Reunión: </span>
              <span style={{ fontSize: "0.875rem" }}>{customer.meetingDate}</span>
            </div>
            <div>
              <span className={`badge ${customer.closed ? "badge-success" : "badge-danger"}`}>
                {customer.closed ? "Cerrada" : "Perdida"}
              </span>
            </div>
          </div>
        </div>

        {extraction ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div className="card" style={{ padding: "1rem", background: "var(--color-surface-elevated)" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text-muted)" }}>
                  Información Básica
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Industria: </span>
                    <span className="badge badge-info">
                      {getLabel(IndustryLabels, extraction.industry)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Modelo de Negocio: </span>
                    <span className="badge badge-info">
                      {getLabel(BusinessModelLabels, extraction.businessModel)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Fuente de Lead: </span>
                    <span>{getLabel(LeadSourceLabels, extraction.leadSource)}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Sentimiento: </span>
                    <span className={`badge ${
                      extraction.sentiment === "POSITIVO" ? "badge-success" :
                      extraction.sentiment === "ESCEPTICO" ? "badge-danger" :
                      "badge-warning"
                    }`}>
                      {getLabel(SentimentLabels, extraction.sentiment)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Urgencia: </span>
                    <span className={`badge ${
                      extraction.urgency === "INMEDIATA" || extraction.urgency === "ALTA" ? "badge-danger" :
                      extraction.urgency === "MEDIA" ? "badge-warning" :
                      "badge-info"
                    }`}>
                      {getLabel(UrgencyLabels, extraction.urgency)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Nivel de Riesgo: </span>
                    <span className={`badge ${
                      extraction.riskLevel === "ALTO" ? "badge-danger" :
                      extraction.riskLevel === "MEDIO" ? "badge-warning" :
                      "badge-success"
                    }`}>
                      {getLabel(RiskLevelLabels, extraction.riskLevel)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "1rem", background: "var(--color-surface-elevated)" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text-muted)" }}>
                  Madurez y Complejidad
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Madurez Proceso: </span>
                    <span>{getLabel(ProcessMaturityLabels, extraction.processMaturity)}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Madurez Herramientas: </span>
                    <span>{getLabel(ToolingMaturityLabels, extraction.toolingMaturity)}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Complejidad Conocimiento: </span>
                    <span>{getLabel(KnowledgeComplexityLabels, extraction.knowledgeComplexity)}</span>
                  </div>
                  {extraction.volume && (
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>Volumen: </span>
                      <span>
                        {extraction.volume.quantity || "-"}{" "}
                        {extraction.volume.quantity && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {getLabel(VolumeUnitLabels, extraction.volume.unit)}
                          </span>
                        )}
                        {extraction.volume.isPeak && (
                          <span className="badge badge-warning" style={{ marginLeft: "0.5rem" }}>
                            Pico
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Pain Points</h3>
              <div className="tag-list">
                {extraction.painPoints && extraction.painPoints.length > 0 ? (
                  extraction.painPoints.map((pp: string) => (
                    <span key={pp} className="tag" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                      {getLabel(PainPointsLabels, pp)}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>No se identificaron pain points</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Jobs-to-be-Done</h3>
              <div className="tag-list">
                {extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0 ? (
                  extraction.jtbdPrimary.map((jtbd: string) => (
                    <span key={jtbd} className="tag" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                      {getLabel(JtbdPrimaryLabels, jtbd)}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>No se identificaron JTBD</span>
                )}
              </div>
            </div>

            {extraction.integrations && extraction.integrations.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Integraciones Necesarias</h3>
                <div className="tag-list">
                  {extraction.integrations.map((integration: string) => (
                    <span key={integration} className="badge badge-info" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                      {getLabel(IntegrationsLabels, integration)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extraction.successMetrics && extraction.successMetrics.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Métricas de Éxito</h3>
                <div className="tag-list">
                  {extraction.successMetrics.map((metric: string) => (
                    <span key={metric} className="badge badge-success" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                      {getLabel(SuccessMetricLabels, metric)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extraction.objections && extraction.objections.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Objeciones</h3>
                <div className="tag-list">
                  {extraction.objections.map((objection: string) => (
                    <span key={objection} className="badge badge-danger" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                      {getLabel(ObjectionsLabels, objection)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            <p>No hay información de extracción disponible para este cliente.</p>
          </div>
        )}

        {customer.transcript && (
          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "2px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Transcripción de la Reunión</h3>
            <blockquote
              style={{
                background: "var(--color-surface-elevated)",
                borderLeft: "4px solid var(--color-primary)",
                padding: "1.5rem",
                margin: 0,
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                lineHeight: "1.8",
                color: "var(--color-text)",
                whiteSpace: "pre-wrap",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {customer.transcript}
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}
