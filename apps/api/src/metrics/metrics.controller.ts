import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MetricsFilterDto } from "./dto/metrics-filter.dto";
import { GetByDimensionDto } from "./dto/get-by-dimension.dto";
import { GetSellerDetailsParamDto } from "./dto/get-seller-details.dto";
import { OverviewService } from "./services/overview.service";
import { ByDimensionService } from "./services/by-dimension.service";
import { ConversionFunnelService } from "./services/conversion-funnel.service";
import { VolumeDistributionService } from "./services/volume-distribution.service";
import { LeadsOverTimeService } from "./services/leads-over-time.service";
import { SankeyService } from "./services/sankey.service";
import { IndustryPainPointHeatmapService } from "./services/industry-painpoint-heatmap.service";
import { OpportunityMatrixService } from "./services/opportunity-matrix.service";
import { WinProbabilityService } from "./services/win-probability.service";
import { VolumeFlowService } from "./services/volume-flow.service";
import { SellersService } from "./services/sellers.service";
import { SalesFunnelService } from "./services/sales-funnel.service";
import { FunnelAnalysisService } from "./services/funnel-analysis.service";
import { ClosureAnalysisService } from "./services/closure-analysis.service";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  constructor(
    private readonly overviewService: OverviewService,
    private readonly byDimensionService: ByDimensionService,
    private readonly conversionFunnelService: ConversionFunnelService,
    private readonly volumeDistributionService: VolumeDistributionService,
    private readonly leadsOverTimeService: LeadsOverTimeService,
    private readonly sankeyService: SankeyService,
    private readonly industryPainPointHeatmapService: IndustryPainPointHeatmapService,
    private readonly opportunityMatrixService: OpportunityMatrixService,
    private readonly winProbabilityService: WinProbabilityService,
    private readonly volumeFlowService: VolumeFlowService,
    private readonly sellersService: SellersService,
    private readonly salesFunnelService: SalesFunnelService,
    private readonly funnelAnalysisService: FunnelAnalysisService,
    private readonly closureAnalysisService: ClosureAnalysisService
  ) { }

  @Get("overview")
  @ApiOperation({ summary: "Get aggregated metrics overview" })
  async getOverview(@Query() query: MetricsFilterDto) {
    return this.overviewService.getOverview(query);
  }

  @Get("by-dim")
  @ApiOperation({ summary: "Get metrics by dimension" })
  async getByDimension(@Query() query: GetByDimensionDto) {
    return this.byDimensionService.getByDimension(query.dimension);
  }

  @Get("conversion-funnel")
  @ApiOperation({ summary: "Get conversion funnel metrics" })
  async getConversionFunnel() {
    return this.conversionFunnelService.getConversionFunnel();
  }

  @Get("volume-distribution")
  @ApiOperation({ summary: "Get volume distribution metrics" })
  async getVolumeDistribution() {
    return this.volumeDistributionService.getVolumeDistribution();
  }

  @Get("leads-over-time")
  @ApiOperation({ summary: "Get leads evolution over time" })
  async getLeadsOverTime(@Query() query: MetricsFilterDto) {
    return this.leadsOverTimeService.getLeadsOverTime(query);
  }

  @Get("sankey")
  @ApiOperation({ summary: "Get sankey diagram data" })
  async getSankeyData() {
    return this.sankeyService.getSankeyData();
  }

  @Get("industry-painpoint-heatmap")
  @ApiOperation({ summary: "Get industry x pain point heatmap data" })
  async getIndustryPainPointHeatmap(@Query() query: MetricsFilterDto) {
    return this.industryPainPointHeatmapService.getIndustryPainPointHeatmap(query);
  }

  @Get("opportunity-matrix")
  @ApiOperation({ summary: "Get opportunity matrix: Volume vs Conversion Rate" })
  async getOpportunityMatrix(@Query() query: MetricsFilterDto) {
    return this.opportunityMatrixService.getOpportunityMatrix(query);
  }

  @Get("win-probability")
  @ApiOperation({ summary: "Get win probability matrix: Urgency vs Sentiment analysis" })
  async getWinProbabilityMatrix(@Query() query: MetricsFilterDto) {
    return this.winProbabilityService.getWinProbabilityMatrix(query);
  }

  @Get("volume-flow")
  @ApiOperation({ summary: "Get volume flow sankey diagram: BusinessModel → VolumeUnit → VolumeIsPeak → Status" })
  async getVolumeFlowSankeyData() {
    return this.volumeFlowService.getVolumeFlowSankeyData();
  }

  @Get("sellers")
  @ApiOperation({ summary: "Get sellers metrics with sentiment distribution" })
  async getSellersMetrics(@Query() query: MetricsFilterDto) {
    return this.sellersService.getSellersMetrics(query);
  }

  @Get("sellers/:seller")
  @ApiOperation({ summary: "Get detailed metrics for a specific seller" })
  async getSellerDetails(@Param() params: GetSellerDetailsParamDto, @Query() query: MetricsFilterDto) {
    return this.sellersService.getSellerDetails(params.seller, { dateFrom: query.dateFrom, dateTo: query.dateTo });
  }

  @Get("sales-funnel-enhanced")
  @ApiOperation({ summary: "Get enhanced sales funnel with multi-dimensional analysis" })
  async getSalesFunnelEnhanced(@Query() query: MetricsFilterDto) {
    return this.salesFunnelService.getSalesFunnelEnhanced(query);
  }

  @Get("sales-funnel-enhanced/insights")
  @ApiOperation({ summary: "Get AI-generated insights for the sales funnel" })
  async getSalesFunnelInsights(@Query() query: MetricsFilterDto) {
    return this.salesFunnelService.getSalesFunnelInsights(query);
  }

  @Get("funnel-analysis")
  @ApiOperation({ summary: "Analyze funnel data quality and validity" })
  async analyzeFunnelDataQuality(@Query() query: MetricsFilterDto) {
    return this.funnelAnalysisService.analyzeFunnelDataQuality(query);
  }

  @Get("closure-analysis")
  @ApiOperation({ summary: "Get closure analysis by categories with statistical significance" })
  async getClosureAnalysis(@Query() query: MetricsFilterDto) {
    return this.closureAnalysisService.getClosureAnalysis(query);
  }
}

