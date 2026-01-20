import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
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
  FunnelAnalysisService,
  ClosureAnalysisService,
} from "./services";

@Module({
  controllers: [MetricsController],
  providers: [
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
    FunnelAnalysisService,
    ClosureAnalysisService,
  ],
})
export class MetricsModule { }
