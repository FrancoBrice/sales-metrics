import { Extraction, LeadSource, Integrations, Volume } from "@vambe/shared";

export interface DeterministicHints {
  leadSource?: LeadSource | null;
  volume?: Volume | null;
  integrations?: Integrations[];
}

export interface LlmExtractionResult {
  extraction: Extraction;
  rawResponse: string;
  metadata?: {
    provider: string;
    model: string;
    durationMs?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LlmClient {
  extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<LlmExtractionResult>;
}
