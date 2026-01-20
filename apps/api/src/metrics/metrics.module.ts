import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import {
  InsightsService,
  LlmInsightsClient,
  BasicInsightsClient,
} from "./services/insights";
import {
  OverviewService,
  ByDimensionService,
  ConversionFunnelService,
  VolumeDistributionService,
  LeadsOverTimeService,
  SankeyService,
  IndustryPainPointHeatmapService,
  OpportunityMatrixService,
  WinProbabilityService,
  VolumeFlowService,
  SellersService,
  SalesFunnelService,
} from "./services";

@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    InsightsService,
    LlmInsightsClient,
    BasicInsightsClient,
    OverviewService,
    ByDimensionService,
    ConversionFunnelService,
    VolumeDistributionService,
    LeadsOverTimeService,
    SankeyService,
    IndustryPainPointHeatmapService,
    OpportunityMatrixService,
    WinProbabilityService,
    VolumeFlowService,
    SellersService,
    SalesFunnelService,
  ],
})
export class MetricsModule { }
