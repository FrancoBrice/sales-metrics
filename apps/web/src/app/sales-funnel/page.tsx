"use client";

import { useState, useEffect } from "react";
import { ClosureAnalysisChart } from "@/components/charts/ClosureAnalysisChart";
import { Filters } from "@/components/features/Filters";
import { api } from "@/lib/api";

export default function SalesFunnelPage() {
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ seller?: string; dateFrom?: string; dateTo?: string }>({});

  useEffect(() => {
    loadSellers();
  }, []);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch {
      setSellers([]);
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "2rem" }}>
        <h1>
          Análisis de Cierres por Categoría
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
          Análisis estadístico de cierres por fuente de lead, industria, JTBD, pain points y vendedores
        </p>
      </div>

      <Filters
        sellers={sellers}
        filters={{
          seller: filters.seller,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }}
        onChange={(newFilters) => {
          setFilters({
            seller: newFilters.seller,
            dateFrom: newFilters.dateFrom,
            dateTo: newFilters.dateTo,
          });
        }}
        variant="dashboard"
      />

      <ClosureAnalysisChart filters={filters} />
    </div>
  );
}
