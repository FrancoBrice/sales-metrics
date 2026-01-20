import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { OpenAiClient, DeepSeekClient, ValidationService, ExtractionParser } from "./llm";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    ValidationService,
    ExtractionParser,
    OpenAiClient,
    DeepSeekClient,
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
