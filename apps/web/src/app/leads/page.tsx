"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/Filters";
import { LeadSourceLabels } from "@vambe/shared";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LeadsTimeData {
  period: string;
  total: number;
  bySource: Record<string, number>;
}

const SOURCE_COLORS: Record<string, string> = {
  Google: "#4285F4",
  Linkedin: "#0077B5",
  LinkedIn: "#0077B5",
  Recomendación: "#34A853",
  Conferencia: "#EA4335",
  Feria: "#FBBC05",
  Artículo: "#FF6D01",
  Webinar: "#46BDC6",
  Email: "#D44638",
  Networking: "#7B1FA2",
  Podcast: "#C2185B",
  Desconocido: "#9E9E9E",
  Otro: "#607D8B",
};

const PALETTE = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800",
  "#FF5722", "#795548", "#9E9E9E", "#607D8B"
];

const getColor = (source: string, index: number) => {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source];
  // Simple hash for consistent fallback color
  return PALETTE[index % PALETTE.length];
};

export default function LeadsPage() {
  const [data, setData] = useState<LeadsTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const response = await api.metrics.leadsOverTime({
        seller: filters.seller,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setData(response.leadsOverTime);
    } catch (error) {
      console.error("Failed to load leads data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Transform data for Recharts: flatten bySource into the main object
  const chartData = data.map((item) => {
    const flattened: any = { period: item.period, total: item.total };
    Object.entries(item.bySource).forEach(([source, count]) => {
      flattened[source] = count;
    });
    return flattened;
  });

  // Get all unique sources present in the data for creating lines
  const allSources = Array.from(
    new Set(data.flatMap((d) => Object.keys(d.bySource)))
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Análisis de Leads</h1>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <h3>No hay datos disponibles</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Evolución de Leads por Fuente</h3>
          </div>

          <div style={{ height: "500px", padding: "1rem", fontSize: "0.875rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="period"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)' }}
                />
                <YAxis
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                  itemStyle={{ color: "var(--color-text)" }}
                  formatter={(value: number, name: string) => [
                    value,
                    LeadSourceLabels[name as any] || name,
                  ]}
                  labelStyle={{ color: "var(--color-text-muted)", marginBottom: "0.5rem" }}
                />
                <Legend
                  formatter={(value) => LeadSourceLabels[value as any] || value}
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                {allSources.map((source, index) => (
                  <Line
                    key={source}
                    type="monotone"
                    dataKey={source}
                    stroke={getColor(source, index)}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
