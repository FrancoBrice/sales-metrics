"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { OpportunityMatrix } from "@/components/charts/OpportunityMatrix";

export default function OpportunitiesPage() {
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});

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
      <div className="header">
        <div>
          <h1>Matriz de Oportunidad Estratégica</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Prioriza oportunidades combinando volumen promedio y tasa de conversión para maximizar el valor estratégico.
          </p>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      <OpportunityMatrix filters={filters} />
    </div>
  );
}
