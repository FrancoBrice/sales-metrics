import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { IngestModule } from "./ingest/ingest.module";
import { ExtractModule } from "./extract/extract.module";
import { CustomersModule } from "./customers/customers.module";
import { MetricsModule } from "./metrics/metrics.module";
import { THROTTLER_TTL_MS, THROTTLER_LIMIT } from "./common/constants";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLER_TTL_MS,
        limit: THROTTLER_LIMIT,
      },
    ]),
    PrismaModule,
    IngestModule,
    ExtractModule,
    CustomersModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
