"use client";

import { useState, useEffect } from "react";
import { SalesFunnelChart } from "@/components/charts/SalesFunnelChart";
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
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Embudo de Ventas Avanzado
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
          Análisis multidimensional del proceso comercial con insights automáticos
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

      <SalesFunnelChart filters={filters} />
    </div>
  );
}
