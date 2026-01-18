import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { LLM_CLIENT } from "./llm/llmClient.interface";
import { GeminiClient } from "./llm/geminiClient";
import { OpenAiClient } from "./llm/openAiClient";
import { ValidationService } from "./llm/validation.service";
import { ExtractionParser } from "./llm/extraction.parser";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    ValidationService,
    ExtractionParser,
    {
      provide: LLM_CLIENT,
      //useClass: GeminiClient,
      useClass: OpenAiClient,
    },
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
