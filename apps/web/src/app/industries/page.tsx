"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { HeatmapIndustryPainPoint } from "@/components/charts/HeatmapIndustryPainPoint";

export default function IndustriesPage() {
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});

  useEffect(() => {
    loadSellers();
  }, []);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Matriz Industria × Pain Point</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Visualiza la relación estratégica entre industrias y pain points para identificar oportunidades de alto valor.
          </p>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      <HeatmapIndustryPainPoint filters={filters} />
    </div>
  );
}
