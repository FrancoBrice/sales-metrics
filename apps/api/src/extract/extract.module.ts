import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { LLM_CLIENT, GeminiClient, OpenAiClient, ValidationService, ExtractionParser } from "./llm";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    ValidationService,
    ExtractionParser,
    {
      provide: LLM_CLIENT,
      useClass: GeminiClient,
      //useClass: OpenAiClient,
    },
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
