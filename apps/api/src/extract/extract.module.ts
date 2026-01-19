import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { GeminiClient, OpenAiClient, ValidationService, ExtractionParser } from "./llm";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    ValidationService,
    ExtractionParser,
    GeminiClient,
    OpenAiClient,
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
