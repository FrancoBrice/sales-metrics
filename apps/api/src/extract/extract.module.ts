import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { LLM_CLIENT } from "./llm/llmClient.interface";
import { GeminiClient } from "./llm/geminiClient";
import { OpenAiClient } from "./llm/openAiClient";

@Module({
  controllers: [ExtractController],
  providers: [
    ExtractService,
    {
      provide: LLM_CLIENT,
      useClass: GeminiClient,
      // useClass: OpenAiClient,
    },
  ],
  exports: [ExtractService],
})
export class ExtractModule { }
