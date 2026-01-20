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

      <div className="sellers-sort-section">
        <label className="sellers-sort-label">
          Ordenar por:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SellerSortOrder)}
          className="sellers-sort-select"
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
        <div className="sellers-list">
          {sortedSellerMetrics.map((seller) => {
            const conversionWidth = Math.min(100, Math.max(0, (seller.conversionRate / maxConversion) * 100));
            const totalSentiment = seller.sentimentDistribution.reduce((sum, s) => sum + s.total, 0);

            return (
              <div
                key={seller.seller}
                className="seller-card"
                onClick={() => setSelectedSeller(seller.seller)}
              >
                {/* Column 1: Seller Info & Stats */}
                <div>
                  <div className="seller-card-header">
                    <h3 className="seller-card-title">{seller.seller}</h3>
                    <div className="seller-card-badges">
                      <span className={`badge ${seller.conversionRate >= 50 ? "badge-success" : seller.conversionRate >= 30 ? "badge-warning" : "badge-danger"}`}>
                        {seller.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="seller-metrics-grid">
                    <div className="seller-metric-item">
                      <span className="seller-metric-value">{seller.total}</span>
                      <span className="seller-metric-label">Oportunidades</span>
                    </div>
                    <div className="seller-metric-item">
                      <span className="seller-metric-value">{seller.closed}</span>
                      <span className="seller-metric-label">Cerradas</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Conversion Bar & Sentiment */}
                <div className="seller-conversion-section">
                  <div>
                    <div className="seller-conversion-header">
                      <span className="seller-conversion-label">Tasa de Conversión</span>
                      <span className="seller-conversion-value">{seller.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="seller-conversion-bar-container">
                      <div
                        className={`seller-conversion-bar-fill ${seller.conversionRate >= 50 ? "success" : seller.conversionRate >= 30 ? "warning" : "danger"}`}
                        style={{
                          width: `${conversionWidth}%`,
                        }}
                      />
                    </div>
                  </div>

                  {totalSentiment > 0 && (
                     <div className="seller-sentiment-indicators">
                       {seller.sentimentDistribution.map((sentiment) => {
                         if (sentiment.total === 0) return null;
                         return (
                           <div key={sentiment.sentiment} className="seller-sentiment-item">
                             <span className={`seller-sentiment-dot ${sentiment.sentiment === "POSITIVO" ? "positive" : sentiment.sentiment === "ESCEPTICO" ? "negative" : "neutral"}`}></span>
                             <span className="seller-sentiment-label">
                               {SentimentLabels[sentiment.sentiment as Sentiment]}
                             </span>
                             <span className="seller-sentiment-count">
                               {sentiment.total}
                             </span>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>

                {/* Column 3: Action */}
                <div className="seller-action-section">
                  <button className="btn-details">
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
