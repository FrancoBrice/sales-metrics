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
import { ModalOverlay } from "./ModalOverlay";
import { ModalContent } from "./ModalContent";
import { ModalCloseButton } from "./ModalCloseButton";
import { getLabel } from "./helpers";

interface CustomerProfileModalProps {
  customerId: string;
  onClose: () => void;
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
    } catch {
      setCustomer(null);
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

  if (!customer) {
    return null;
  }

  const extraction = customer.extraction;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent size="large" onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClose={onClose} />

        <div className="customer-profile-body">
          <h2 className="customer-profile-header">{customer.name}</h2>
          <div className="customer-profile-badges">
            <div className="customer-profile-info-item">
              <span className="customer-profile-info-label">Email: </span>
              <span className="customer-profile-info-value">{customer.email}</span>
            </div>
            <div className="customer-profile-info-item">
              <span className="customer-profile-info-label">Teléfono: </span>
              <span className="customer-profile-info-value">{customer.phone}</span>
            </div>
            <div className="customer-profile-info-item">
              <span className="customer-profile-info-label">Vendedor: </span>
              <span className="customer-profile-info-value">{customer.seller}</span>
            </div>
            <div className="customer-profile-info-item">
              <span className="customer-profile-info-label">Fecha Reunión: </span>
              <span className="customer-profile-info-value">{customer.meetingDate}</span>
            </div>
            <div>
              <span className={`badge ${customer.closed ? "badge-success" : "badge-danger"}`}>
                {customer.closed ? "Cerrada" : "Perdida"}
              </span>
            </div>
          </div>

        {extraction ? (
          <>
            <div className="modal-info-group">
              <div className="customer-profile-card customer-profile-info-group-card">
                <h4 className="customer-profile-section-title">
                  Información Básica
                </h4>
                <div className="modal-card-content">
                  <div>
                    <span className="modal-info-label">Industria: </span>
                    <span className="badge badge-info">
                      {getLabel(IndustryLabels, extraction.industry)}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Modelo de Negocio: </span>
                    <span className="badge badge-info">
                      {getLabel(BusinessModelLabels, extraction.businessModel)}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Fuente de Lead: </span>
                    <span>{getLabel(LeadSourceLabels, extraction.leadSource)}</span>
                  </div>
                  <div>
                    <span className="modal-info-label">Sentimiento: </span>
                    <span className={`badge ${
                      extraction.sentiment === "POSITIVO" ? "badge-success" :
                      extraction.sentiment === "ESCEPTICO" ? "badge-danger" :
                      "badge-warning"
                    }`}>
                      {getLabel(SentimentLabels, extraction.sentiment)}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Urgencia: </span>
                    <span className={`badge ${
                      extraction.urgency === "INMEDIATA" || extraction.urgency === "ALTA" ? "badge-danger" :
                      extraction.urgency === "MEDIA" ? "badge-warning" :
                      "badge-info"
                    }`}>
                      {getLabel(UrgencyLabels, extraction.urgency)}
                    </span>
                  </div>
                  <div>
                    <span className="modal-info-label">Nivel de Riesgo: </span>
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

              <div className="modal-card">
                <h4 className="modal-card-title">
                  Madurez y Complejidad
                </h4>
                <div className="modal-card-content">
                  <div>
                    <span className="modal-info-label">Madurez Proceso: </span>
                    <span>{getLabel(ProcessMaturityLabels, extraction.processMaturity)}</span>
                  </div>
                  <div>
                    <span className="modal-info-label">Madurez Herramientas: </span>
                    <span>{getLabel(ToolingMaturityLabels, extraction.toolingMaturity)}</span>
                  </div>
                  <div>
                    <span className="modal-info-label">Complejidad Conocimiento: </span>
                    <span>{getLabel(KnowledgeComplexityLabels, extraction.knowledgeComplexity)}</span>
                  </div>
                  {extraction.volume && (
                    <div>
                      <span className="modal-info-label">Volumen: </span>
                      <span>
                        {extraction.volume.quantity || "-"}{" "}
                        {extraction.volume.quantity && (
                          <span className="customer-profile-volume-unit">
                            {getLabel(VolumeUnitLabels, extraction.volume.unit)}
                          </span>
                        )}
                        {extraction.volume.isPeak && (
                          <span className="badge badge-warning customer-profile-volume-peak">
                            Peak
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Pain Points</h3>
              <div className="customer-profile-tag-list">
                {extraction.painPoints && extraction.painPoints.length > 0 ? (
                  extraction.painPoints.map((pp: string) => (
                    <span key={pp} className="tag customer-profile-tag">
                      {getLabel(PainPointsLabels, pp)}
                    </span>
                  ))
                ) : (
                  <span className="modal-empty-state">No se identificaron pain points</span>
                )}
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Jobs-to-be-Done</h3>
              <div className="customer-profile-tag-list">
                {extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0 ? (
                  extraction.jtbdPrimary.map((jtbd: string) => (
                    <span key={jtbd} className="tag customer-profile-tag">
                      {getLabel(JtbdPrimaryLabels, jtbd)}
                    </span>
                  ))
                ) : (
                  <span className="modal-empty-state">No se identificaron JTBD</span>
                )}
              </div>
            </div>

            {extraction.integrations && extraction.integrations.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">Integraciones Necesarias</h3>
                <div className="customer-profile-tag-list">
                  {extraction.integrations.map((integration: string) => (
                    <span key={integration} className="badge badge-info customer-profile-tag">
                      {getLabel(IntegrationsLabels, integration)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extraction.successMetrics && extraction.successMetrics.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">Métricas de Éxito</h3>
                <div className="customer-profile-tag-list">
                  {extraction.successMetrics.map((metric: string) => (
                    <span key={metric} className="badge badge-success customer-profile-tag">
                      {getLabel(SuccessMetricLabels, metric)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extraction.objections && extraction.objections.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">Objeciones</h3>
                <div className="customer-profile-tag-list">
                  {extraction.objections.map((objection: string) => (
                    <span key={objection} className="badge badge-danger customer-profile-tag">
                      {getLabel(ObjectionsLabels, objection)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="modal-empty-state">
            <p>No hay información de extracción disponible para este cliente.</p>
          </div>
        )}

        {customer.transcript && (
          <div className="modal-transcript">
            <h3 className="modal-section-title">Transcripción de la Reunión</h3>
            <blockquote className="modal-transcript-blockquote">
              {customer.transcript}
            </blockquote>
          </div>
        )}
        </div>
      </ModalContent>
    </ModalOverlay>
  );
}
