const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export interface CustomerWithExtraction {
  id: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  meetingDate: string;
  closed: boolean;
  createdAt: string;
  meetingId: string | null;
  extraction: {
    industry: string | null;
    businessModel: string | null;
    leadSource: string | null;
    painPoints: string[];
    jtbdPrimary: string[];
    volume: {
      quantity: number | null;
      unit: string | null;
      isPeak: boolean;
    } | null;
  } | null;
}

export interface MetricsOverview {
  totalCustomers: number;
  closedDeals: number;
  conversionRate: number;
  avgVolume: number | null;
  topLeadSources: Array<{ source: string; count: number }>;
  topPainPoints: Array<{
    painPoint: string;
    count: number;
    closed: number;
    conversionRate: number;
  }>;
  topJobsToBeDone: Array<{
    jtbd: string;
    count: number;
    closed: number;
    conversionRate: number;
  }>;
  bySeller: Array<{
    seller: string;
    total: number;
    closed: number;
    conversionRate: number;
  }>;
}

export interface MetricsByDimension {
  dimension: string;
  values: Array<{
    value: string;
    count: number;
    closedCount: number;
    conversionRate: number;
  }>;
}

export interface ConversionFunnel {
  stages: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

export interface CustomerFilters {
  seller?: string;
  closed?: boolean;
  leadSource?: string;
  dateFrom?: string;
  dateTo?: string;
  industry?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const api = {
  customers: {
    list: (filters?: CustomerFilters) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.closed !== undefined) params.set("closed", String(filters.closed));
      if (filters?.leadSource) params.set("leadSource", filters.leadSource);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);
      if (filters?.industry) params.set("industry", filters.industry);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const query = params.toString();
      return fetchApi<PaginatedResponse<CustomerWithExtraction> | CustomerWithExtraction[]>(
        `/customers${query ? `?${query}` : ""}`
      ).then((res) => {
        // Handle migration period where api might return array or object
        if (Array.isArray(res)) {
          return { data: res, meta: { total: res.length, page: 1, limit: 1000, totalPages: 1 } };
        }
        return res;
      });
    },
    getSellers: () => fetchApi<string[]>("/customers/sellers"),
    getById: (id: string) => fetchApi<CustomerWithExtraction & { transcript: string | null }>(`/customers/${id}`),
  },
  metrics: {
    overview: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<MetricsOverview>(`/metrics/overview${query ? `?${query}` : ""}`);
    },
    sellers: (filters?: { dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<Array<{
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
      }>>(`/metrics/sellers${query ? `?${query}` : ""}`);
    },
    sellerDetails: (seller: string, filters?: { dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        seller: string;
        total: number;
        closed: number;
        conversionRate: number;
        avgVolume: number | null;
        sentimentDistribution: Array<{
          sentiment: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        topIndustries: Array<{
          industry: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        topLeadSources: Array<{
          source: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        topPainPoints: Array<{
          painPoint: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        urgencyBreakdown: Array<{
          urgency: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        riskBreakdown: Array<{
          riskLevel: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
      }>(`/metrics/sellers/${encodeURIComponent(seller)}${query ? `?${query}` : ""}`);
    },
    byDimension: (dimension: string) =>
      fetchApi<MetricsByDimension>(`/metrics/by-dim?dimension=${dimension}`),
    conversionFunnel: () => fetchApi<ConversionFunnel>("/metrics/conversion-funnel"),
    leadsOverTime: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{ leadsOverTime: Array<{ period: string; total: number; bySource: Record<string, number> }> }>(
        `/metrics/leads-over-time${query ? `?${query}` : ""}`
      );
    },
    sankey: () =>
      fetchApi<{
        nodes: Array<{ name: string; category: string }>;
        links: Array<{ source: number; target: number; value: number }>;
      }>("/metrics/sankey"),
    volumeFlow: () =>
      fetchApi<{
        nodes: Array<{ name: string; category: string }>;
        links: Array<{ source: number; target: number; value: number }>;
      }>("/metrics/volume-flow"),
    industryPainPointHeatmap: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        industries: string[];
        painPoints: string[];
        cells: Array<{
          industry: string;
          painPoint: string;
          total: number;
          closed: number;
          conversionRate: number;
          avgVolume: number;
        }>;
      }>(`/metrics/industry-painpoint-heatmap${query ? `?${query}` : ""}`);
    },
    opportunityMatrix: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        opportunities: Array<{
          category: "industry" | "painPoint";
          name: string;
          total: number;
          closed: number;
          avgVolume: number;
          conversionRate: number;
        }>;
        quadrants: {
          highValue: Array<{ category: "industry" | "painPoint"; name: string; total: number; closed: number; avgVolume: number; conversionRate: number }>;
          quickWins: Array<{ category: "industry" | "painPoint"; name: string; total: number; closed: number; avgVolume: number; conversionRate: number }>;
          development: Array<{ category: "industry" | "painPoint"; name: string; total: number; closed: number; avgVolume: number; conversionRate: number }>;
          lowPriority: Array<{ category: "industry" | "painPoint"; name: string; total: number; closed: number; avgVolume: number; conversionRate: number }>;
        };
        thresholds: {
          volume: number;
          conversion: number;
        };
      }>(`/metrics/opportunity-matrix${query ? `?${query}` : ""}`);
    },
    winProbability: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        matrix: Array<{
          urgency: string;
          sentiment: string;
          total: number;
          closed: number;
          conversionRate: number;
          winProbability: number;
          riskBreakdown: Array<{
            riskLevel: string;
            total: number;
            closed: number;
            conversionRate: number;
          }>;
        }>;
        urgencyStats: Array<{
          urgency: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
        sentimentStats: Array<{
          sentiment: string;
          total: number;
          closed: number;
          conversionRate: number;
        }>;
      }>(`/metrics/win-probability${query ? `?${query}` : ""}`);
    },
    salesFunnelEnhanced: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        stages: Array<{
          name: string;
          total: number;
          closed: number;
          conversionRate: number;
          progressionRate?: number;
          breakdown: {
            byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }>;
            byJTBD: Record<string, { total: number; closed: number; conversionRate: number }>;
            byIndustry: Record<string, { total: number; closed: number; conversionRate: number }>;
          };
          topPerformers: string[];
          dropOffRate: number;
        }>;
        trends: {
          conversionTrend: Array<{ period: string; conversionRate: number }>;
          leadSourceEvolution: Record<string, Array<{ period: string; count: number }>>;
        };
      }>(`/metrics/sales-funnel-enhanced${query ? `?${query}` : ""}`);
    },
    salesFunnelInsights: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        bottlenecks: string[];
        opportunities: string[];
        recommendations: string[];
        dataQuality?: {
          topPerformers: Array<{ category: string; total: number; closed: number; conversionRate: number }>;
          underperformers: Array<{ category: string; total: number; closed: number; conversionRate: number }>;
          significantFindings: Array<{ category: string; dimension: string; significance: string; reasoning: string }>;
        };
      }>(`/metrics/sales-funnel-enhanced/insights${query ? `?${query}` : ""}`);
    },
    closureAnalysis: (filters?: { seller?: string; dateFrom?: string; dateTo?: string }) => {
      const params = new URLSearchParams();
      if (filters?.seller) params.set("seller", filters.seller);
      if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.set("dateTo", filters.dateTo);

      const query = params.toString();
      return fetchApi<{
        byLeadSource: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
        byIndustry: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
        byJTBD: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
        byPainPoint: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
        bySeller: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
        overall: { total: number; closed: number; conversionRate: number };
        insights: {
          topPerformers: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
          underperformers: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
          highVolumeOpportunities: Array<{ category: string; total: number; closed: number; conversionRate: number; confidence: number; volume: number }>;
          statisticalSignificance: Array<{ category: string; dimension: string; significance: "high" | "medium" | "low"; reasoning: string }>;
        };
      }>(`/metrics/closure-analysis${query ? `?${query}` : ""}`);
    },
  },
  ingest: {
    uploadCsv: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/ingest/csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
  },
  extract: {
    extractAll: () => fetchApi<{ total: number; success: number; failed: number }>("/extract/bulk/all", { method: "POST" }),
    extractPendingAndFailed: () => fetchApi<{ total: number; success: number; failed: number; pending: number; retried: number }>("/extract/bulk/pending-and-failed", { method: "POST" }),
    retryFailed: () => fetchApi<{ total: number; success: number; failed: number; skipped: number }>("/extract/bulk/retry-failed", { method: "POST" }),
    getProgress: () => fetchApi<{ total: number; completed: number; success: number; failed: number; pending: number; retried: number }>("/extract/progress", { method: "GET" }),
  },
};
