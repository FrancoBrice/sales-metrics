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
import { Loading, EmptyState } from "@/components/ui/Loading";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [sellers, setSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSellers();
    loadDashboardData();
  }, [filters]);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractFromDashboard() {
    setExtracting(true);
    setProgress({ current: 0, total: 0 });

    const startProgressEstimate = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setProgress({ current: 0, total: 60 });

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (!prev) return prev;
          const increment = Math.max(1, Math.floor(prev.total / 20));
          const newCurrent = Math.min(prev.current + increment, prev.total * 0.95);
          return { ...prev, current: newCurrent };
        });
      }, 500);
    };

    startProgressEstimate();

    try {
      const result = await api.extract.extractAll();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setProgress({ current: result.total, total: result.total });

      setTimeout(() => {
        setProgress(null);
        setToast({
          message: `Análisis completado: ${result.success} exitosos, ${result.failed} fallidos`,
          type: result.failed === 0 ? ToastType.Success : ToastType.Info,
        });
      }, 500);

      await loadDashboardData();
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(null);
      setToast({
        message: "Error al iniciar el análisis",
        type: ToastType.Error,
      });
    } finally {
      setExtracting(false);
    }
  }

  async function handleRetryFailed() {
    setRetrying(true);
    setToast({
      message: "Reintentando análisis fallidos...",
      type: ToastType.Info,
    });

    try {
      const result = await api.extract.retryFailed();
      setToast({
        message: `Reintento completado: ${result.success} exitosos, ${result.failed} fallidos, ${result.skipped} omitidos`,
        type: result.failed === 0 ? ToastType.Success : ToastType.Info,
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Retry failed:", error);
      setToast({
        message: "Error al reintentar análisis fallidos",
        type: ToastType.Error,
      });
    } finally {
      setRetrying(false);
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
          <h1>Vambe Sales Metrics</h1>
          <p className="header-subtitle">
            Panel de control integral para análisis de métricas de ventas y clientes
          </p>
        </div>
        <div className="header-actions">
          <Button variant={ButtonVariant.Secondary} onClick={handleExtractFromDashboard} disabled={extracting || retrying}>
            {extracting ? "Analizando..." : "Analizar Pendientes"}
          </Button>
          <Button variant={ButtonVariant.Outline} onClick={handleRetryFailed} disabled={extracting || retrying}>
            {retrying ? "Reintentando..." : "Reintentar Fallidos"}
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
                href="/flujo-conversion"
                title="Flujo de Conversión"
                description="Diagrama Sankey"
              />
            </LinkCardGrid>
          </div>

          <ChartsSection metrics={metrics} />
        </>
      ) : (
        <EmptyState
          title="No hay datos disponibles"
          message="Importa un archivo CSV para comenzar"
        />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadDashboardData();
            loadSellers();
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
