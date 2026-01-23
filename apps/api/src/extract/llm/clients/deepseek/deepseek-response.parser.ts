import { Injectable } from "@nestjs/common";
import { Extraction } from "@vambe/shared";
import { tryParseJson } from "../../utils/jsonRepair";
import { ValidationService } from "../../services/validation.service";
import {
  DeepSeekApiException,
  DeepSeekJsonParseException,
  DeepSeekValidationException,
} from "./deepseek.exceptions";

export interface ApiCompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

export interface ParsedExtractionResult {
  extraction: Extraction;
  rawResponse: string;
  metadata: {
    provider: string;
    model: string;
    durationMs: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

@Injectable()
export class DeepSeekResponseParser {
  constructor(private readonly validationService: ValidationService) {}

  parse(
    apiResponse: ApiCompletionResponse,
    transcript: string,
    modelName: string,
    durationMs: number
  ): ParsedExtractionResult {
    const rawResponse = this.buildRawResponse(apiResponse, modelName);

    const jsonMatch = apiResponse.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new DeepSeekApiException(
        `No valid JSON found in DeepSeek API response. Raw response: ${apiResponse.content}`,
        rawResponse,
        this.buildMetadata("deepseek", modelName, durationMs, apiResponse.usage)
      );
    }

    const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
    if (!parsed) {
      throw new DeepSeekJsonParseException(
        `Failed to parse JSON from DeepSeek API response. Raw JSON: ${jsonMatch[0]}`,
        rawResponse,
        this.buildMetadata("deepseek", modelName, durationMs, apiResponse.usage),
        jsonMatch[0]
      );
    }

    try {
      const extraction = this.validationService.validateAndMerge(parsed, transcript);

      return {
        extraction,
        rawResponse,
        metadata: this.buildMetadata("deepseek", modelName, durationMs, apiResponse.usage),
      };
    } catch (validationError) {
      throw new DeepSeekValidationException(
        `Validation failed: ${validationError}`,
        rawResponse,
        this.buildMetadata("deepseek", modelName, durationMs, apiResponse.usage),
        validationError
      );
    }
  }

  private buildRawResponse(apiResponse: ApiCompletionResponse, modelName: string): string {
    return JSON.stringify({
      content: apiResponse.content,
      model: modelName,
      usage: apiResponse.usage,
      timestamp: new Date().toISOString(),
    });
  }

  private buildMetadata(
    provider: string,
    model: string,
    durationMs: number,
    usage: ApiCompletionResponse["usage"]
  ) {
    return {
      provider,
      model,
      durationMs,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
    };
  }
}
