export interface InsightsData {
  stages: Array<{
    name: string;
    total: number;
    closed: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  breakdown: {
    byLeadSource: Record<string, { total: number; closed: number; conversionRate: number }>;
    byJTBD: Record<string, { total: number; closed: number; conversionRate: number }>;
    byIndustry: Record<string, { total: number; closed: number; conversionRate: number }>;
  };
  topPerformers: string[];
  trends?: {
    conversionTrend: Array<{ period: string; conversionRate: number }>;
  };
  statisticalAnalysis?: {
    topPerformers: Array<{ category: string; conversionRate: number; total: number; closed: number }>;
    underperformers: Array<{ category: string; conversionRate: number; total: number; closed: number }>;
    highVolumeOpportunities: Array<{ category: string; volume: number; conversionRate: number; total: number }>;
    significantFindings: Array<{ category: string; dimension: string; significance: string; reasoning: string }>;
  };
  overallMetrics?: {
    total: number;
    closed: number;
    conversionRate: number;
  };
}

export interface InsightsResult {
  bottlenecks: string[];
  opportunities: string[];
  recommendations: string[];
  metadata?: {
    provider: string;
    model: string;
    durationMs?: number;
    cached?: boolean;
  };
}

export interface InsightsClient {
  generateInsights(data: InsightsData): Promise<InsightsResult>;
}
