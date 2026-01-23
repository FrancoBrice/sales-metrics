import { ExtractionStatus, Extraction, LeadSource, Volume, Integrations } from "@vambe/shared";

export interface ExtractionResult {
  id: string;
  meetingId: string;
  extraction: Extraction | null;
  status: ExtractionStatus;
  error?: string;
}

export interface ExtractionProgress {
  total: number;
  completed: number;
  success: number;
  failed: number;
  pending: number;
  retried: number;
}

export interface DeterministicResult {
  leadSource: LeadSource | null;
  volume: Volume | null;
  integrations: Integrations[];
  confidence: { leadSource: number; volume: number; integrations: number };
}

export interface ErrorWithMetadata {
  metadata?: { model?: string; provider?: string; durationMs?: number; promptTokens?: number; completionTokens?: number; totalTokens?: number };
  rawResponse?: string;
}
