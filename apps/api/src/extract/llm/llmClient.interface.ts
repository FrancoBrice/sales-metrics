import { Extraction } from "@vambe/shared";

export interface LlmClient {
  extractFromTranscript(transcript: string): Promise<Extraction>;
}

export const LLM_CLIENT = Symbol("LLM_CLIENT");
