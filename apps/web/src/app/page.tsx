"use client";

import { useEffect, useState } from "react";
import { api, MetricsOverview } from "@/lib/api";
import { MetricsCards } from "@/components/ui/MetricsCards";
import { UploadModal } from "@/components/ui/UploadModal";
import { Toast, ToastType } from "@/components/ui/Toast";
import { ProgressSnackbar } from "@/components/ui/ProgressSnackbar";
import { Button, ButtonVariant } from "@/components/ui/Button";
import { LinkCard, LinkCardGrid } from "@/components/ui/LinkCard";
import { Loading, EmptyStateWithType } from "@/components/ui/Loading";
import { useExtractionProgress } from "@/hooks/useExtractionProgress";
import { buildCompletionMessage, buildUploadCompletionMessage } from "@/utils/extractionMessages";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { progress, extracting, startExtractionWithCallback, checkInitialProgress } = useExtractionProgress();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    checkInitialProgress();
  }, [checkInitialProgress]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const metricsData = await api.metrics.overview({});
      setMetrics(metricsData);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractFromDashboard() {
    try {
      const result = await api.extract.extractPendingAndFailed();

      if (result.total === 0) {
        setToast({
          message: "No hay registros pendientes para procesar",
          type: ToastType.Info,
        });
        return;
      }

      startExtractionWithCallback((progressData) => {
        setToast({
          message: buildCompletionMessage(progressData),
          type: progressData.failed === 0 ? ToastType.Success : ToastType.Info,
        });
        loadDashboardData();
      });
    } catch {
      setToast({
        message: "Error al iniciar el análisis",
        type: ToastType.Error,
      });
    }
  }

  return (
    <div className="dashboard-container">
      <div className="hero-section">
        <p className="hero-subtitle">ANÁLISIS INTELIGENTE DE VENTAS</p>
        <h1 className="hero-title">TUS DATOS A DECISIONES, EN SEGUNDOS</h1>
        <p className="hero-description">
          Automatiza el análisis de transcripciones con IA. <strong>Extrae insights automáticamente</strong>, identifica patrones y toma decisiones basadas en datos. <strong>Más precisión, más velocidad</strong>, sin esfuerzo manual.
        </p>
      </div>

      <div className="action-section">
        <Button variant={ButtonVariant.Primary} onClick={() => setShowUpload(true)} className="btn-cta-primary">
          Importar CSV
        </Button>
        <Button variant={ButtonVariant.Secondary} onClick={handleExtractFromDashboard} disabled={extracting} className="btn-cta-secondary">
          {extracting ? "Analizando..." : "Analizar Pendientes"}
        </Button>
      </div>

      {loading && !metrics ? (
        <Loading />
      ) : metrics ? (
        <>
          <MetricsCards metrics={metrics} />

          <div className="dashboard-footer">
            <div className="footer-item">
              <span className="footer-dot footer-dot-success"></span>
              <span>Análisis con IA en tiempo real</span>
            </div>
            <div className="footer-item">
              <span className="footer-dot footer-dot-primary"></span>
              <span>Extracción automática de insights</span>
            </div>
            <div className="footer-item">
              <span className="footer-dot footer-dot-secondary"></span>
              <span>Visualizaciones interactivas</span>
            </div>
          </div>

          <div className="insights-section">
            <h2 className="insights-title">Explorar Análisis</h2>
            <LinkCardGrid>
              <LinkCard
                href="/opportunities"
                title="Matriz de Oportunidades"
                description="Volumen vs Conversión"
              />
              <LinkCard
                href="/win-probability"
                title="Probabilidad de Cierre"
                description="Análisis predictivo"
              />
              <LinkCard
                href="/industries"
                title="Heatmap Industrias"
                description="Industry × Pain Point"
              />
              <LinkCard
                href="/conversion-flow"
                title="Flujo de Conversión"
                description="Diagrama Sankey"
              />
              <LinkCard
                href="/leads"
                title="Análisis de Leads"
                description="Evolución temporal"
              />
              <LinkCard
                href="/customers"
                title="Cartera de Clientes"
                description="Vista detallada"
              />
              <LinkCard
                href="/sellers"
                title="Desempeño Vendedores"
                description="Métricas por vendedor"
              />
              <LinkCard
                href="/sales-funnel"
                title="Análisis de Cierres"
                description="Embudo de ventas"
              />
              <LinkCard
                href="/pain-points"
                title="Pain Points"
                description="Análisis de problemas"
              />
            </LinkCardGrid>
          </div>
        </>
      ) : (
        <EmptyStateWithType type="dashboard" />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
          onUploadComplete={(uploadResult) => {
            const estimatedTotal = Math.max(uploadResult.created + uploadResult.updated, 1);

            if (estimatedTotal > 0) {
              startExtractionWithCallback((progressData) => {
                setToast({
                  message: buildUploadCompletionMessage(progressData, uploadResult.duplicates),
                  type: progressData.failed === 0 ? ToastType.Success : ToastType.Info,
                });
                loadDashboardData();
              }, estimatedTotal);
            } else if (uploadResult.duplicates > 0) {
              setToast({
                message: `Análisis completado: 0 exitosos, 0 fallidos, ${uploadResult.duplicates} duplicados`,
                type: ToastType.Success,
              });
              loadDashboardData();
            }
          }}
        />
      )}

      {progress && (
        <ProgressSnackbar
          message="Procesando transcripciones..."
          progress={progress.current}
          total={progress.total}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
