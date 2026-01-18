"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { LeadSourceLabels, IndustryLabels, PainPointsLabels, LeadSource, Industry, PainPoints } from "@vambe/shared";
import { EmptyStateWithType } from "@/components/ui/Loading";

interface SellerMetrics {
  seller: string;
  total: number;
  closed: number;
  conversionRate: number;
  leadSources: Record<string, number>;
  industries: Record<string, { total: number; closed: number }>;
  painPoints: Record<string, { total: number; closed: number }>;
  avgVolume: number | null;
}

export default function SellersMetricsPage() {
  const [sellers, setSellers] = useState<string[]>([]);
  const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({});

  useEffect(() => {
    loadSellers();
    loadSellerMetrics();
  }, [filters]);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch (error) {
      console.error("Failed to load sellers:", error);
    }
  }

  async function loadSellerMetrics() {
    setLoading(true);
    try {
      const allCustomers = await api.customers.list({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      const metricsMap: Record<string, SellerMetrics> = {};

      allCustomers.data.forEach((customer) => {
        const seller = customer.seller;
        if (!metricsMap[seller]) {
          metricsMap[seller] = {
            seller,
            total: 0,
            closed: 0,
            conversionRate: 0,
            leadSources: {},
            industries: {},
            painPoints: {},
            avgVolume: null,
          };
        }

        const metrics = metricsMap[seller];
        metrics.total++;
        if (customer.closed) {
          metrics.closed++;
        }

        const extraction = customer.extraction;
        if (extraction) {
          if (extraction.leadSource) {
            metrics.leadSources[extraction.leadSource] = (metrics.leadSources[extraction.leadSource] || 0) + 1;
          }

          if (extraction.industry) {
            if (!metrics.industries[extraction.industry]) {
              metrics.industries[extraction.industry] = { total: 0, closed: 0 };
            }
            metrics.industries[extraction.industry].total++;
            if (customer.closed) {
              metrics.industries[extraction.industry].closed++;
            }
          }

          extraction.painPoints?.forEach((painPoint) => {
            if (!metrics.painPoints[painPoint]) {
              metrics.painPoints[painPoint] = { total: 0, closed: 0 };
            }
            metrics.painPoints[painPoint].total++;
            if (customer.closed) {
              metrics.painPoints[painPoint].closed++;
            }
          });

          if (extraction.volume?.quantity) {
            const volumes = allCustomers.data
              .filter((c) => c.seller === seller && c.extraction?.volume?.quantity)
              .map((c) => c.extraction!.volume!.quantity!);
            metrics.avgVolume = volumes.length > 0
              ? volumes.reduce((a, b) => a + b, 0) / volumes.length
              : null;
          }
        }
      });

      const metricsArray = Object.values(metricsMap).map((m) => ({
        ...m,
        conversionRate: m.total > 0 ? (m.closed / m.total) * 100 : 0,
      }));

      metricsArray.forEach((m) => {
        const volumes = allCustomers.data
          .filter((c) => c.seller === m.seller && c.extraction?.volume?.quantity)
          .map((c) => c.extraction!.volume!.quantity!);
        m.avgVolume = volumes.length > 0
          ? volumes.reduce((a, b) => a + b, 0) / volumes.length
          : null;
      });

      setSellerMetrics(metricsArray.sort((a, b) => b.conversionRate - a.conversionRate));
    } catch (error) {
      console.error("Failed to load seller metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Métricas de Vendedores</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Análisis detallado del desempeño y efectividad por vendedor
          </p>
        </div>
      </div>

      <Filters
        sellers={sellers}
        filters={filters}
        onChange={setFilters}
        variant="dashboard"
      />

      {sellerMetrics.length === 0 ? (
        <EmptyStateWithType type="sellers" />
      ) : (
        (() => {
          const maxTotal = Math.max(...sellerMetrics.map((s) => s.total), 1);
          const maxClosed = Math.max(...sellerMetrics.map((s) => s.closed), 1);
          const maxConversion = Math.max(...sellerMetrics.map((s) => s.conversionRate), 1);

          const allLeadSources = Array.from(
            new Set(sellerMetrics.flatMap((s) => Object.keys(s.leadSources)))
          );

          const allIndustries = Array.from(
            new Set(sellerMetrics.flatMap((s) => Object.keys(s.industries)))
          );

          return (
            <div className="charts-grid">
        <div className="card">
          <h3 className="section-title">Ranking de Conversión</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sellerMetrics.map((seller, index) => {
              const conversionWidth = (seller.conversionRate / maxConversion) * 100;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

              return (
                <div key={seller.seller} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ minWidth: "30px", fontSize: "1.25rem", textAlign: "center" }}>
                    {medal}
                  </div>
                  <div style={{ minWidth: "120px", fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>
                    {seller.seller}
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: `${conversionWidth}%`,
                        height: "32px",
                        background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: "0.75rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "white",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      {seller.conversionRate.toFixed(1)}%
                    </div>
                    <div style={{ minWidth: "60px", fontSize: "0.875rem", color: "var(--color-text-muted)", textAlign: "right" }}>
                      {seller.closed}/{seller.total}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Volumen de Oportunidades</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sellerMetrics
              .sort((a, b) => b.total - a.total)
              .map((seller) => {
                const totalWidth = (seller.total / maxTotal) * 100;
                const closedWidth = seller.total > 0 ? (seller.closed / seller.total) * 100 : 0;

                return (
                  <div key={seller.seller} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>
                        {seller.seller}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                        {seller.total} oportunidades
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "24px",
                        background: "var(--color-surface-elevated)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${totalWidth}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                          opacity: 0.3,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: `${closedWidth}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        {seller.closed}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {allLeadSources.length > 0 && (
          <div className="card">
            <h3 className="section-title">Fuentes de Leads por Vendedor</h3>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${allLeadSources.length}, 1fr)`, gap: "1rem" }}>
              {sellerMetrics.map((seller) => (
                <div key={seller.seller} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.5rem" }}>
                    {seller.seller}
                  </div>
                  {allLeadSources.map((source) => {
                    const count = seller.leadSources[source] || 0;
                    const maxCount = Math.max(...sellerMetrics.map((s) => s.leadSources[source] || 0), 1);
                    const height = (count / maxCount) * 100;

                    return (
                      <div key={source} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {LeadSourceLabels[source as LeadSource] || source}
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                          <div
                            style={{
                              flex: 1,
                              height: `${Math.max(height, 10)}px`,
                              background: "linear-gradient(180deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                              paddingBottom: "0.25rem",
                              fontSize: "0.7rem",
                              color: "white",
                              fontWeight: 600,
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {allIndustries.length > 0 && (
          <div className="card">
            <h3 className="section-title">Efectividad por Industria</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {allIndustries.map((industry) => {
                const industryStats = sellerMetrics.map((seller) => {
                  const stats = seller.industries[industry] || { total: 0, closed: 0 };
                  return {
                    seller: seller.seller,
                    ...stats,
                    conversionRate: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0,
                  };
                }).filter((s) => s.total > 0);

                if (industryStats.length === 0) return null;

                const maxTotal = Math.max(...industryStats.map((s) => s.total), 1);

                return (
                  <div key={industry}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.75rem" }}>
                      {IndustryLabels[industry as Industry] || industry}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {industryStats
                        .sort((a, b) => b.conversionRate - a.conversionRate)
                        .map((stat) => {
                          const totalWidth = (stat.total / maxTotal) * 100;
                          const closedWidth = stat.total > 0 ? (stat.closed / stat.total) * 100 : 0;

                          return (
                            <div key={stat.seller} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <div style={{ minWidth: "100px", fontSize: "0.8rem", color: "var(--color-text)" }}>
                                {stat.seller}
                              </div>
                              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div
                                  style={{
                                    width: `${totalWidth}%`,
                                    height: "20px",
                                    background: "var(--color-surface-elevated)",
                                    borderRadius: "var(--radius-sm)",
                                    overflow: "hidden",
                                    position: "relative",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${closedWidth}%`,
                                      height: "100%",
                                      background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                                    }}
                                  />
                                </div>
                                <div style={{ minWidth: "60px", fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "right" }}>
                                  {stat.closed}/{stat.total}
                                </div>
                                <div style={{ minWidth: "50px", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)", textAlign: "right" }}>
                                  {stat.conversionRate.toFixed(0)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="section-title">Comparativa de Métricas Clave</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {sellerMetrics.map((seller) => {
              const metrics = [
                { label: "Total", value: seller.total, max: maxTotal, color: "var(--color-primary)" },
                { label: "Cerrados", value: seller.closed, max: maxClosed, color: "var(--color-secondary)" },
                { label: "Conversión", value: seller.conversionRate, max: maxConversion, color: "var(--color-primary)" },
              ];

              return (
                <div key={seller.seller} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", textAlign: "center" }}>
                    {seller.seller}
                  </div>
                  {metrics.map((metric) => {
                    const percentage = (metric.value / metric.max) * 100;
                    const displayValue = metric.label === "Conversión" ? `${metric.value.toFixed(1)}%` : metric.value.toString();

                    return (
                      <div key={metric.label} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>{metric.label}</span>
                          <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{displayValue}</span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "8px",
                            background: "var(--color-surface-elevated)",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${metric.color} 0%, var(--color-secondary) 100%)`,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
        );
        })()
      )}
    </div>
  );
}
