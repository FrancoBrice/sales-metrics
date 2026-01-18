import { Extraction, LeadSource, Integrations, Volume } from "@vambe/shared";

export interface DeterministicHints {
  leadSource?: LeadSource | null;
  volume?: Volume | null;
  integrations?: Integrations[];
}

export interface LlmClient {
  extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<Extraction>;
}

export const LLM_CLIENT = Symbol("LLM_CLIENT");
