"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
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

  // Get all unique sources present in the data for creating lines
  const allSources = Array.from(
    new Set(data.flatMap((d) => Object.keys(d.bySource)))
  );

  // Transform data for Recharts: flatten bySource into the main object
  const chartData = data.map((item) => {
    const flattened: any = { period: item.period, total: item.total };
    // Initialize all sources to 0 to ensure lines drop to 0
    allSources.forEach((source) => {
      flattened[source] = 0;
    });
    Object.entries(item.bySource).forEach(([source, count]) => {
      flattened[source] = count;
    });
    return flattened;
  });

  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const handleLegendClick = (e: any) => {
    const dataKey = e.dataKey;
    if (hiddenSeries.includes(dataKey)) {
      setHiddenSeries(hiddenSeries.filter((s) => s !== dataKey));
    } else {
      setHiddenSeries([...hiddenSeries, dataKey]);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Análisis de Leads</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Evolución temporal de leads por fuente de origen
          </p>
        </div>
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
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                fontWeight: "normal",
              }}
            >
              Haz clic en la leyenda para mostrar/ocultar fuentes
            </span>
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            backgroundColor: "var(--color-surface-elevated)",
                            border: "1px solid var(--color-border)",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-md)",
                            boxShadow: "var(--shadow-lg)",
                          }}
                        >
                          <p
                            style={{
                              color: "var(--color-text-muted)",
                              marginBottom: "0.5rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            {label}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                            }}
                          >
                            {payload.map((entry: any, index: number) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  fontSize: "0.875rem",
                                  color: "var(--color-text)",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: entry.color,
                                  }}
                                />
                                <span>
                                  {(LeadSourceLabels as any)[entry.name] ||
                                    entry.name}
                                  : {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value, entry: any) => {
                    const label = (LeadSourceLabels as any)[value] || value;
                    return (
                      <span
                        style={{
                          color: hiddenSeries.includes(value)
                            ? "var(--color-text-muted)"
                            : "var(--color-text)",
                          textDecoration: hiddenSeries.includes(value)
                            ? "line-through"
                            : "none",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </span>
                    );
                  }}
                  wrapperStyle={{ paddingTop: "20px" }}
                  onClick={handleLegendClick}
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
                    hide={hiddenSeries.includes(source)}
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
