"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters, MetricsOverview } from "@/lib/api";
import { Filters } from "@/components/Filters";
import { MetricsCards } from "@/components/MetricsCards";
import { ChartsSection } from "@/components/ChartsSection";
import { UploadModal } from "@/components/UploadModal";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [sellers, setSellers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({});

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
    try {
      await api.extract.extractAll();
      // Reload based on new data
      await loadDashboardData();
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Error al iniciar el análisis");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Vambe Sales Metrics</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExtractFromDashboard}
            disabled={extracting}
          >
            {extracting ? "Analizando..." : "🔍 Analizar Pendientes"}
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
    </div>
  );
}
