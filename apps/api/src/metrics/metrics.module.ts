import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import {
  InsightsService,
  LlmInsightsClient,
  BasicInsightsClient,
} from "./services/insights";
import {
  OverviewService,
  LeadsOverTimeService,
  SankeyService,
  IndustryPainPointHeatmapService,
  OpportunityMatrixService,
  WinProbabilityService,
  VolumeFlowService,
  SellersService,
  ClosureInsightsService,
  ClosureAnalysisService,
} from "./services";

@Module({
  controllers: [MetricsController],
  providers: [
    InsightsService,
    LlmInsightsClient,
    BasicInsightsClient,
    OverviewService,
    LeadsOverTimeService,
    SankeyService,
    IndustryPainPointHeatmapService,
    OpportunityMatrixService,
    WinProbabilityService,
    VolumeFlowService,
    SellersService,
    ClosureInsightsService,
    ClosureAnalysisService,
  ],
})
export class MetricsModule { }
