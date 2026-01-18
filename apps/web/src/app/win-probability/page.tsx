"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { WinProbabilityMatrix } from "@/components/charts/WinProbabilityMatrix";

export default function WinProbabilityPage() {
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
          <h1>Análisis de Probabilidad de Cierre</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Predicción inteligente de probabilidad de cierre usando datos extraídos del LLM: Urgencia, Sentimiento y Nivel de Riesgo.
          </p>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      <WinProbabilityMatrix filters={filters} />
    </div>
  );
}
