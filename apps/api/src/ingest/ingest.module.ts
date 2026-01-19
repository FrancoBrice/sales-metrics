import { Module } from "@nestjs/common";
import { IngestController } from "./ingest.controller";
import { IngestService } from "./ingest.service";
import { ExtractModule } from "../extract/extract.module";

@Module({
  imports: [ExtractModule],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule { }
