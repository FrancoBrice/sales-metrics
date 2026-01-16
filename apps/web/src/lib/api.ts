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
    confidence: number;
  } | null;
}

export interface MetricsOverview {
  totalCustomers: number;
  closedDeals: number;
  conversionRate: number;
  avgVolume: number | null;
  topLeadSources: Array<{ source: string; count: number }>;
  topPainPoints: Array<{ painPoint: string; count: number }>;
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

      const query = params.toString();
      return fetchApi<CustomerWithExtraction[]>(`/customers${query ? `?${query}` : ""}`);
    },
    getSellers: () => fetchApi<string[]>("/customers/sellers"),
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
    byDimension: (dimension: string) =>
      fetchApi<MetricsByDimension>(`/metrics/by-dim?dimension=${dimension}`),
    conversionFunnel: () => fetchApi<ConversionFunnel>("/metrics/conversion-funnel"),
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
  },
};
