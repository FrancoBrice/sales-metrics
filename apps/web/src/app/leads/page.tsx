"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { LeadSourceLabels } from "@vambe/shared";
import { EmptyStateWithType } from "@/components/ui/Loading";
import { leadSourceColors, chartPalette } from "@/constants/colors";
import { TooltipContent, TooltipRow } from "@/components/ui/Tooltip";
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
import "@/styles/pages/leads.css";

interface LeadsTimeData {
  period: string;
  total: number;
  bySource: Record<string, number>;
}

const SOURCE_COLORS = leadSourceColors;
const PALETTE = chartPalette;

const getColor = (source: string, index: number) => {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source];
  return PALETTE[index % PALETTE.length];
};

export default function LeadsPage() {
  const [data, setData] = useState<LeadsTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<string[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

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
    } catch {
      setSellers([]);
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
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const allSources = Array.from(
    new Set(data.flatMap((d) => Object.keys(d.bySource)))
  );

  const chartData = data.map((item) => {
    const flattened: any = { period: item.period, total: item.total };
    allSources.forEach((source) => {
      flattened[source] = item.bySource[source] || 0;
    });
    return flattened;
  });

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
          <p className="leads-page-subtitle">
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
        <EmptyStateWithType type="leads" />
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Evolución de Leads por Fuente</h3>
            <span className="leads-chart-legend-hint">
              Haz clic en la leyenda para mostrar/ocultar fuentes
            </span>
          </div>

          <div className="leads-chart-container">
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
                        <TooltipContent title={label}>
                          {payload.map((entry: any, index: number) => (
                            <TooltipRow
                              key={index}
                              label={
                                <div className="leads-tooltip-label-container">
                                  <div
                                    className="leads-tooltip-dot"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>
                                    {(LeadSourceLabels as any)[entry.name] || entry.name}
                                  </span>
                                </div>
                              }
                              value={entry.value}
                            />
                          ))}
                        </TooltipContent>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const label = (LeadSourceLabels as any)[value] || value;
                    const isHidden = hiddenSeries.includes(value);
                    return (
                      <span className={`leads-legend-item ${isHidden ? 'hidden' : ''}`}>
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
