import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { IngestModule } from "./ingest/ingest.module";
import { ExtractModule } from "./extract/extract.module";
import { CustomersModule } from "./customers/customers.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IngestModule,
    ExtractModule,
    CustomersModule,
    MetricsModule,
  ],
})
export class AppModule { }
