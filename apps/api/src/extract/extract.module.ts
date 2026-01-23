import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { DeepSeekClient, DeepSeekResponseParser, RetryHandler } from "./llm";
import { ValidationService, ExtractionParser } from "./llm";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    ValidationService,
    ExtractionParser,
    DeepSeekResponseParser,
    RetryHandler,
    DeepSeekClient,
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
