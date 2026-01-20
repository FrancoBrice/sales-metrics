"use client";

import { MetricsOverview } from "@/lib/api";

interface MetricsCardsProps {
  metrics: MetricsOverview | null;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  if (!metrics) return null;

  const cards = [
    {
      value: metrics.totalCustomers,
      label: "Total Clientes",
      format: "number",
    },
    {
      value: metrics.closedDeals,
      label: "Ventas Cerradas",
      format: "number",
    },
    {
      value: metrics.conversionRate,
      label: "Porcentaje de Cierre",
      format: "percent",
    },
  ];

  const formatValue = (value: number | null, format: string, suffix?: string) => {
    if (value === null) return "N/A";
    if (format === "percent") return `${value.toFixed(1)}%`;
    return `${Math.round(value)}${suffix || ""}`;
  };

  return (
    <div className="metrics-grid">
      {cards.map((card, index) => (
        <div key={index} className="metric-card">
          <div className="metric-value">
            {formatValue(card.value, card.format, card.suffix)}
          </div>
          <div className="metric-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
