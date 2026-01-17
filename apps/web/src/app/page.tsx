"use client";

import { useEffect, useState, useRef } from "react";
import { api, CustomerFilters, MetricsOverview } from "@/lib/api";
import { Filters } from "@/components/Filters";
import { MetricsCards } from "@/components/MetricsCards";
import { ChartsSection } from "@/components/ChartsSection";
import { UploadModal } from "@/components/UploadModal";
import { Toast } from "@/components/Toast";
import { ProgressSnackbar } from "@/components/ProgressSnackbar";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [sellers, setSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
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
          type: result.failed === 0 ? "success" : "info",
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
        type: "error",
      });
    } finally {
      setExtracting(false);
    }
  }

  async function handleRetryFailed() {
    setRetrying(true);
    setToast({
      message: "Reintentando análisis fallidos...",
      type: "info",
    });

    try {
      const result = await api.extract.retryFailed();
      setToast({
        message: `Reintento completado: ${result.success} exitosos, ${result.failed} fallidos, ${result.skipped} omitidos`,
        type: result.failed === 0 ? "success" : "info",
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Retry failed:", error);
      setToast({
        message: "Error al reintentar análisis fallidos",
        type: "error",
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
        <h1>Vambe Sales Metrics</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExtractFromDashboard}
            disabled={extracting || retrying}
          >
            {extracting ? "Analizando..." : "🔍 Analizar Pendientes"}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleRetryFailed}
            disabled={extracting || retrying}
            style={{ marginRight: "0.5rem" }}
          >
            {retrying ? "Reintentando..." : "🔄 Reintentar Fallidos"}
          </button>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            📤 Importar CSV
          </button>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      {loading && !metrics ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : metrics ? (
        <>
          <MetricsCards metrics={metrics} />
          {/* Note: Charts currently represent global distribution or seller specific data from separate endpoints.
              Ideally these would also re-fetch based on filters if the API supported it.
              The MetricsCards reflect the filtered data. */}
          <ChartsSection metrics={metrics} />
        </>
      ) : (
        <div className="empty-state">
          <h3>No hay datos disponibles</h3>
          <p>Importa un archivo CSV para comenzar</p>
        </div>
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
