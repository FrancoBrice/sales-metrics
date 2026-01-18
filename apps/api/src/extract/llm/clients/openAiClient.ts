import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { Extraction } from "@vambe/shared";
import { LlmClient, DeterministicHints } from "./llmClient.interface";
import { ValidationService } from "../services/validation.service";
import { buildExtractionPrompt } from "../prompt/promptBuilder";
import { tryParseJson } from "../utils/jsonRepair";

@Injectable()
export class OpenAiClient implements LlmClient {
  private readonly logger = new Logger(OpenAiClient.name);
  private readonly openai: OpenAI;
  private readonly modelName = "gpt-4.1-nano";

  constructor(
    private readonly configService: ConfigService,
    private readonly validationService: ValidationService
  ) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required. Please configure it in the environment variables.");
    }
    this.openai = new OpenAI({ apiKey });
  }

  async extractFromTranscript(
    transcript: string,
    hints?: DeterministicHints
  ): Promise<Extraction> {
    try {
      const prompt = buildExtractionPrompt(transcript, hints);

      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.modelName,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content || "";

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in OpenAI API response");
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        throw new Error("Failed to parse JSON from OpenAI API response");
      }

      return this.validationService.validateAndMerge(parsed, transcript);
    } catch (error) {
      this.logger.error(`OpenAI extraction failed: ${error}`);
      throw new Error(`OpenAI extraction failed: ${error}`);
    }
  }
}
