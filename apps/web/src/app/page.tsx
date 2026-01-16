"use client";

import { useState, useEffect, useCallback } from "react";
import { api, CustomerWithExtraction, MetricsOverview, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/Filters";
import { MetricsCards } from "@/components/MetricsCards";
import { CustomersTable } from "@/components/CustomersTable";
import { ChartsSection } from "@/components/ChartsSection";
import { UploadModal } from "@/components/UploadModal";

export default function Dashboard() {
  const [customers, setCustomers] = useState<CustomerWithExtraction[]>([]);
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, metricsData, sellersData] = await Promise.all([
        api.customers.list(filters),
        api.metrics.overview({
          seller: filters.seller,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }),
        api.customers.getSellers(),
      ]);
      setCustomers(customersData);
      setMetrics(metricsData);
      setSellers(sellersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadData();
  };

  const handleExtractAll = async () => {
    setExtracting(true);
    try {
      const result = await api.extract.extractAll();
      alert(`Extracción completada: ${result.success} exitosas, ${result.failed} fallidas`);
      loadData();
    } catch (error) {
      console.error("Error extracting:", error);
      alert("Error al ejecutar extracciones");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Vambe Sales Metrics</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExtractAll}
            disabled={extracting}
          >
            {extracting ? "Procesando..." : "🔄 Analizar Pendientes"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
          >
            📤 Importar CSV
          </button>
        </div>
      </header>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={handleFilterChange}
      />

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <MetricsCards metrics={metrics} />

          <ChartsSection metrics={metrics} />

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Clientes ({customers.length})</h2>
            </div>
            <CustomersTable customers={customers} />
          </div>
        </>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
