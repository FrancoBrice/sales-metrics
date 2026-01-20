"use client";

import { useEffect, useState, useRef } from "react";
import { api, CustomerFilters, MetricsOverview } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { MetricsCards } from "@/components/ui/MetricsCards";
import { ChartsSection } from "@/components/charts/ChartsSection";
import { UploadModal } from "@/components/ui/UploadModal";
import { Toast, ToastType } from "@/components/ui/Toast";
import { ProgressSnackbar } from "@/components/ui/ProgressSnackbar";
import { Button, ButtonVariant } from "@/components/ui/Button";
import { LinkCard, LinkCardGrid } from "@/components/ui/LinkCard";
import { Loading, EmptyStateWithType } from "@/components/ui/Loading";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [sellers, setSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSellers();
    loadDashboardData();
  }, [filters]);

  useEffect(() => {
    checkExtractionProgress();
  }, []);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch {
      setSellers([]);
    }
  }

  async function loadDashboardData() {
    setLoading(true);
    try {
      const metricsData = await api.metrics.overview({
        seller: filters.seller,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setMetrics(metricsData);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  function startProgressPolling(onComplete?: (progressData: { total: number; completed: number; success: number; failed: number; pending: number; retried: number }) => void) {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const checkProgress = async () => {
      try {
        const progressData = await api.extract.getProgress();

        console.log("Progress data:", progressData);

        if (progressData.total === 0) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          setExtracting(false);
          setProgress(null);
          return;
        }

        const newProgress = { current: progressData.completed, total: progressData.total };
        console.log("Updating progress to:", newProgress);
        setProgress((prev) => {
          console.log("Previous progress:", prev);
          return newProgress;
        });

        if (progressData.completed >= progressData.total) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }

          setTimeout(() => {
            setProgress(null);

            if (onComplete) {
              onComplete(progressData);
            } else {
              const messageParts = [];
              if (progressData.pending > 0) {
                messageParts.push(`${progressData.pending} pendientes`);
              }
              if (progressData.retried > 0) {
                messageParts.push(`${progressData.retried} reintentos`);
              }
              const statusMessage = messageParts.length > 0 ? ` (${messageParts.join(", ")})` : "";

              let toastMessage = `Análisis completado: ${progressData.success} exitosos`;
              if (progressData.failed > 0) {
                toastMessage += `, ${progressData.failed} fallidos`;
                if (progressData.failed === progressData.total - progressData.success) {
                  toastMessage += " (posible falta de cuota en la API)";
                }
              }
              toastMessage += statusMessage;

              setToast({
                message: toastMessage,
                type: progressData.failed === 0 ? ToastType.Success : ToastType.Info,
              });
            }
          }, 500);

          await loadDashboardData();
          setExtracting(false);
        }
      } catch (error) {
        console.error("Error checking progress:", error);
      }
    };

    checkProgress();
    progressIntervalRef.current = setInterval(checkProgress, 1000);
  }

  async function checkExtractionProgress() {
    try {
      const progressData = await api.extract.getProgress();

      if (progressData.total > 0 && progressData.completed < progressData.total) {
        setExtracting(true);
        setProgress({ current: progressData.completed, total: progressData.total });
        startProgressPolling();
      }
    } catch (error) {
      console.error("Error checking extraction progress:", error);
    }
  }

  async function handleExtractFromDashboard() {
    setExtracting(true);
    setProgress({ current: 0, total: 1 });

    try {
      const result = await api.extract.extractPendingAndFailed();
      const total = result.total || 0;

      if (total === 0) {
        setExtracting(false);
        setProgress(null);
        setToast({
          message: "No hay registros pendientes para procesar",
          type: ToastType.Info,
        });
        return;
      }

      try {
        const initialProgress = await api.extract.getProgress();
        setProgress({ current: initialProgress.completed, total: initialProgress.total || total });
      } catch (error) {
        console.error("Error getting initial progress:", error);
        setProgress({ current: 0, total });
      }

      startProgressPolling();
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(null);
      setToast({
        message: "Error al iniciar el análisis",
        type: ToastType.Error,
      });
      setExtracting(false);
    }
  }

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Sales Metrics</h1>
          <p className="header-subtitle">
            Panel de control integral para análisis de métricas de ventas y clientes
          </p>
        </div>
        <div className="header-actions">
          <Button variant={ButtonVariant.Secondary} onClick={handleExtractFromDashboard} disabled={extracting}>
            {extracting ? "Analizando..." : "Analizar Pendientes"}
          </Button>
          <Button variant={ButtonVariant.Primary} onClick={() => setShowUpload(true)}>
            Importar CSV
          </Button>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      {loading && !metrics ? (
        <Loading />
      ) : metrics ? (
        <>
          <MetricsCards metrics={metrics} />

          <div className="section-container">
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
            </LinkCardGrid>
          </div>

          <ChartsSection metrics={metrics} />
        </>
      ) : (
        <EmptyStateWithType type="dashboard" />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadDashboardData();
            loadSellers();
          }}
          onUploadComplete={(uploadResult) => {
            const estimatedTotal = Math.max(uploadResult.created + uploadResult.updated, 1);

            if (estimatedTotal > 0) {
              setExtracting(true);
              setProgress({ current: 0, total: estimatedTotal });

              api.extract.extractPendingAndFailed()
                .then(async (result) => {
                  const actualTotal = result.total || estimatedTotal;

                  try {
                    const initialProgress = await api.extract.getProgress();
                    setProgress({ current: initialProgress.completed, total: initialProgress.total || actualTotal });
                  } catch (error) {
                    console.error("Error getting initial progress:", error);
                    setProgress({ current: 0, total: actualTotal });
                  }

                  startProgressPolling((progressData) => {
                    const messageParts = [];
                    if (progressData.pending > 0) {
                      messageParts.push(`${progressData.pending} pendientes`);
                    }
                    if (progressData.retried > 0) {
                      messageParts.push(`${progressData.retried} reintentos`);
                    }
                    const statusMessage = messageParts.length > 0 ? ` (${messageParts.join(", ")})` : "";
                    const duplicatesMessage = uploadResult.duplicates > 0 ? `, ${uploadResult.duplicates} duplicados` : "";
                    setToast({
                      message: `Análisis completado: ${progressData.success} exitosos, ${progressData.failed} fallidos${duplicatesMessage}${statusMessage}`,
                      type: progressData.failed === 0 ? ToastType.Success : ToastType.Info,
                    });
                    loadDashboardData();
                    loadSellers();
                  });
                })
                .catch((error) => {
                  if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                  }
                  setProgress(null);
                  setToast({
                    message: "Error al iniciar el análisis",
                    type: ToastType.Error,
                  });
                  setExtracting(false);
                });
            } else if (uploadResult.duplicates > 0) {
              setToast({
                message: `Análisis completado: 0 exitosos, 0 fallidos, ${uploadResult.duplicates} duplicados`,
                type: ToastType.Success,
              });
              loadDashboardData();
              loadSellers();
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
