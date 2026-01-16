import { Injectable } from "@nestjs/common";
import { Extraction } from "@vambe/shared";
import { LlmClient } from "./llmClient.interface";

@Injectable()
export class GeminiClientPlaceholder implements LlmClient {
  async extractFromTranscript(transcript: string): Promise<Extraction> {
    throw new Error("GeminiClientPlaceholder: This is a placeholder implementation. Configure GEMINI_API_KEY to use real Gemini API.");
  }

}
