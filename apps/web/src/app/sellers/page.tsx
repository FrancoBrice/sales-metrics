"use client";

import { useEffect, useState } from "react";
import { api, CustomerFilters } from "@/lib/api";
import { Filters } from "@/components/features/Filters";
import { EmptyStateWithType, Loading } from "@/components/ui/Loading";
import { SellerProfileModal } from "@/components/ui/SellerProfileModal";
import { SentimentLabels, Sentiment, SellerSortOrder, SellerSortOrderLabels } from "@vambe/shared";

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
  const [sortOrder, setSortOrder] = useState<SellerSortOrder>(SellerSortOrder.CONVERSION_RATE);

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

  const sortedSellerMetrics = [...sellerMetrics].sort((a, b) => {
    if (sortOrder === SellerSortOrder.CLOSED) {
      if (b.closed !== a.closed) {
        return b.closed - a.closed;
      }
      return b.conversionRate - a.conversionRate;
    } else {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.closed - a.closed;
    }
  });

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
        hideSellerFilter={true}
      />

      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <label style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
          Ordenar por:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SellerSortOrder)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          {Object.values(SellerSortOrder).map((order) => (
            <option key={order} value={order}>
              {SellerSortOrderLabels[order]}
            </option>
          ))}
        </select>
      </div>

      {sellerMetrics.length === 0 ? (
        <EmptyStateWithType type="sellers" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedSellerMetrics.map((seller) => {
            const conversionWidth = Math.min(100, Math.max(0, (seller.conversionRate / maxConversion) * 100));
            const totalSentiment = seller.sentimentDistribution.reduce((sum, s) => sum + s.total, 0);

            return (
              <div
                key={seller.seller}
                className="card seller-card"
                onClick={() => setSelectedSeller(seller.seller)}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  display: "grid",
                  gridTemplateColumns: "250px 1fr 200px",
                  gap: "2rem",
                  alignItems: "center"
                }}
              >
                {/* Column 1: Seller Info & Stats */}
                <div>
                  <div className="seller-card-header" style={{ marginBottom: "1rem", justifyContent: "flex-start", gap: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{seller.seller}</h3>
                    <div className="seller-card-badges">
                      <span className={`badge ${seller.conversionRate >= 50 ? "badge-success" : seller.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
                        {seller.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>{seller.total}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Oportunidades</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>{seller.closed}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Cerradas</div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Conversion Bar & Sentiment */}
                <div style={{ borderLeft: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)", padding: "0 2rem" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Tasa de Conversión</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>{seller.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "var(--color-surface-elevated)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div
                        style={{
                          width: `${conversionWidth}%`,
                          height: "100%",
                          background: seller.conversionRate >= 50
                            ? "linear-gradient(90deg, var(--color-success) 0%, var(--color-secondary) 100%)"
                            : seller.conversionRate >= 30
                            ? "linear-gradient(90deg, var(--color-warning) 0%, var(--color-secondary) 100%)"
                            : "linear-gradient(90deg, var(--color-danger) 0%, var(--color-secondary) 100%)",
                          borderRadius: "var(--radius-sm)",
                          transition: "width 0.5s ease"
                        }}
                      />
                    </div>
                  </div>

                  {totalSentiment > 0 && (
                     <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem" }}>
                       {seller.sentimentDistribution.map((sentiment) => {
                         if (sentiment.total === 0) return null;
                         return (
                           <div key={sentiment.sentiment} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                             <span style={{
                               width: "8px",
                               height: "8px",
                               borderRadius: "50%",
                               background: sentiment.sentiment === "POSITIVO" ? "var(--color-success)" :
                                           sentiment.sentiment === "ESCEPTICO" ? "var(--color-danger)" : "var(--color-warning)"
                             }}></span>
                             <span style={{ color: "var(--color-text-muted)" }}>
                               {SentimentLabels[sentiment.sentiment as Sentiment]}
                             </span>
                             <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                               {sentiment.total}
                             </span>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>

                {/* Column 3: Action */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                  <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-primary)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-md)",
                        transition: "var(--transition-base)"
                    }}
                    className="btn-details"
                  >
                    Ver detalles
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
