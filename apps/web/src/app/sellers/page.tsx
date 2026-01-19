"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { EmptyStateWithType, Loading } from "@/components/ui/Loading";
import { SellerProfileModal } from "@/components/ui/SellerProfileModal";
import { SentimentLabels, Sentiment } from "@vambe/shared";

interface SellerMetrics {
  seller: string;
  total: number;
  closed: number;
  conversionRate: number;
  sentimentDistribution: Array<{
    sentiment: string;
    total: number;
    closed: number;
    conversionRate: number;
    percentage: number;
  }>;
}

export default function SellersMetricsPage() {
  const [sellers, setSellers] = useState<string[]>([]);
  const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

  useEffect(() => {
    loadSellers();
    loadSellerMetrics();
  }, [filters]);

  async function loadSellers() {
    try {
      const data = await api.customers.getSellers();
      setSellers(data);
    } catch {
      setSellers([]);
    }
  }

  async function loadSellerMetrics() {
    setLoading(true);
    try {
      const data = await api.metrics.sellers({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setSellerMetrics(data);
    } catch {
      setSellerMetrics([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <Loading />
      </div>
    );
  }

  const maxConversion = Math.max(...sellerMetrics.map((s) => s.conversionRate), 1);
  const maxTotal = Math.max(...sellerMetrics.map((s) => s.total), 1);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Métricas de Vendedores</h1>
          <p className="header-subtitle">
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
        <>
          <div className="charts-grid">
            {sellerMetrics.map((seller, index) => {
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
              const conversionWidth = (seller.conversionRate / maxConversion) * 100;
              const totalSentiment = seller.sentimentDistribution.reduce((sum, s) => sum + s.total, 0);

              return (
                <div
                  key={seller.seller}
                  className="card seller-card"
                  onClick={() => setSelectedSeller(seller.seller)}
                >
                  <div className="seller-card-header">
                    <div className="seller-card-title">
                      {medal && <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>{medal}</span>}
                      <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{seller.seller}</h3>
                    </div>
                    <div className="seller-card-badges">
                      <span className={`badge ${seller.conversionRate >= 50 ? "badge-success" : seller.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
                        {seller.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="metrics-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                    <div className="metric-card" style={{ padding: "1rem" }}>
                      <div className="metric-value" style={{ fontSize: "2rem" }}>{seller.total}</div>
                      <div className="metric-label">Oportunidades</div>
                    </div>
                    <div className="metric-card" style={{ padding: "1rem" }}>
                      <div className="metric-value" style={{ fontSize: "2rem" }}>{seller.closed}</div>
                      <div className="metric-label">Cerradas</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Tasa de Conversión</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{seller.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${conversionWidth}%`,
                          background: seller.conversionRate >= 50
                            ? "linear-gradient(90deg, var(--color-success) 0%, var(--color-secondary) 100%)"
                            : seller.conversionRate >= 30
                            ? "linear-gradient(90deg, var(--color-warning) 0%, var(--color-secondary) 100%)"
                            : "linear-gradient(90deg, var(--color-danger) 0%, var(--color-secondary) 100%)",
                        }}
                      />
                    </div>
                  </div>

                  {totalSentiment > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <h4 className="section-title" style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                        Distribución de Sentimientos
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {seller.sentimentDistribution.map((sentiment) => {
                          if (sentiment.total === 0) return null;

                          const sentimentColor =
                            sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                            sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" :
                            "var(--color-warning)";

                          return (
                            <div key={sentiment.sentiment} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{ minWidth: "80px", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                {SentimentLabels[sentiment.sentiment as Sentiment]}
                              </div>
                              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div className="bar-container" style={{ height: "20px" }}>
                                  <div
                                    className="bar-fill"
                                    style={{
                                      width: `${sentiment.percentage}%`,
                                      background: `linear-gradient(90deg, ${sentimentColor} 0%, ${sentimentColor}dd 100%)`,
                                    }}
                                  />
                                </div>
                                <div style={{ minWidth: "60px", fontSize: "0.75rem", textAlign: "right", color: "var(--color-text-muted)" }}>
                                  {sentiment.total} ({sentiment.percentage.toFixed(0)}%)
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-primary)", cursor: "pointer" }}>
                      Ver detalles →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ marginTop: "2rem" }}>
            <h3 className="section-title">Comparativa de Sentimientos por Vendedor</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {sellerMetrics.map((seller) => {
                const totalSentiment = seller.sentimentDistribution.reduce((sum, s) => sum + s.total, 0);
                if (totalSentiment === 0) return null;

                const orderedSentiments = [
                  seller.sentimentDistribution.find((s) => s.sentiment === "POSITIVO"),
                  seller.sentimentDistribution.find((s) => s.sentiment === "NEUTRAL"),
                  seller.sentimentDistribution.find((s) => s.sentiment === "ESCEPTICO"),
                ].filter((s) => s && s.total > 0);

                return (
                  <div key={seller.seller}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                        {seller.seller}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {totalSentiment} {totalSentiment === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>
                    <div style={{ position: "relative", height: "32px", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--color-surface-elevated)" }}>
                      {orderedSentiments.map((sentiment, idx) => {
                        if (!sentiment || sentiment.total === 0) return null;

                        const sentimentColor =
                          sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                          sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" :
                          "var(--color-warning)";

                        const leftOffset = orderedSentiments.slice(0, idx).reduce((sum, s) => sum + (s?.percentage || 0), 0);

                        return (
                          <div
                            key={sentiment.sentiment}
                            style={{
                              position: "absolute",
                              left: `${leftOffset}%`,
                              width: `${sentiment.percentage}%`,
                              height: "100%",
                              background: sentimentColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "white",
                              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                            }}
                            title={`${SentimentLabels[sentiment.sentiment as Sentiment]}: ${sentiment.total} (${sentiment.percentage.toFixed(1)}%)`}
                          >
                            {sentiment.percentage > 15 && (
                              <span>{SentimentLabels[sentiment.sentiment as Sentiment].charAt(0)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            <h3 className="section-title">Ranking de Conversión</h3>
            <div className="bar-chart">
              {[...sellerMetrics]
                .sort((a, b) => {
                  if (b.conversionRate !== a.conversionRate) {
                    return b.conversionRate - a.conversionRate;
                  }
                  return b.total - a.total;
                })
                .map((seller, index) => {
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                  const width = maxConversion > 0 ? (seller.conversionRate / maxConversion) * 100 : 0;

                  return (
                    <div key={seller.seller} className="bar-item">
                      <div className="bar-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {medal && <span>{medal}</span>}
                        <span>{seller.seller}</span>
                      </div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${width}%`,
                            background: seller.conversionRate >= 50
                              ? "linear-gradient(90deg, var(--color-success) 0%, var(--color-secondary) 100%)"
                              : seller.conversionRate >= 30
                              ? "linear-gradient(90deg, var(--color-warning) 0%, var(--color-secondary) 100%)"
                              : "linear-gradient(90deg, var(--color-danger) 0%, var(--color-secondary) 100%)",
                          }}
                        />
                      </div>
                      <div className="bar-value">
                        {seller.conversionRate.toFixed(1)}% ({seller.closed}/{seller.total})
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {selectedSeller && (
        <SellerProfileModal
          seller={selectedSeller}
          onClose={() => setSelectedSeller(null)}
          filters={{
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          }}
        />
      )}
    </div>
  );
}
