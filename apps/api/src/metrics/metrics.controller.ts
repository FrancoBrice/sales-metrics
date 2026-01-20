import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MetricsService } from "./metrics.service";
import { MetricsFilterDto } from "./dto/metrics-filter.dto";
import { GetByDimensionDto } from "./dto/get-by-dimension.dto";
import { GetSellerDetailsParamDto } from "./dto/get-seller-details.dto";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) { }

  @Get("overview")
  @ApiOperation({ summary: "Get aggregated metrics overview" })
  async getOverview(@Query() query: MetricsFilterDto) {
    return this.metricsService.getOverview(query);
  }

  @Get("by-dim")
  @ApiOperation({ summary: "Get metrics by dimension" })
  async getByDimension(@Query() query: GetByDimensionDto) {
    return this.metricsService.getByDimension(query.dimension);
  }

  @Get("conversion-funnel")
  @ApiOperation({ summary: "Get conversion funnel metrics" })
  async getConversionFunnel() {
    return this.metricsService.getConversionFunnel();
  }

  @Get("volume-distribution")
  @ApiOperation({ summary: "Get volume distribution metrics" })
  async getVolumeDistribution() {
    return this.metricsService.getVolumeDistribution();
  }

  @Get("leads-over-time")
  @ApiOperation({ summary: "Get leads evolution over time" })
  async getLeadsOverTime(@Query() query: MetricsFilterDto) {
    return this.metricsService.getLeadsOverTime(query);
  }

  @Get("sankey")
  @ApiOperation({ summary: "Get sankey diagram data" })
  async getSankeyData() {
    return this.metricsService.getSankeyData();
  }

  @Get("industry-painpoint-heatmap")
  @ApiOperation({ summary: "Get industry x pain point heatmap data" })
  async getIndustryPainPointHeatmap(@Query() query: MetricsFilterDto) {
    return this.metricsService.getIndustryPainPointHeatmap(query);
  }

  @Get("opportunity-matrix")
  @ApiOperation({ summary: "Get opportunity matrix: Volume vs Conversion Rate" })
  async getOpportunityMatrix(@Query() query: MetricsFilterDto) {
    return this.metricsService.getOpportunityMatrix(query);
  }

  @Get("win-probability")
  @ApiOperation({ summary: "Get win probability matrix: Urgency vs Sentiment analysis" })
  async getWinProbabilityMatrix(@Query() query: MetricsFilterDto) {
    return this.metricsService.getWinProbabilityMatrix(query);
  }

  @Get("volume-flow")
  @ApiOperation({ summary: "Get volume flow sankey diagram: BusinessModel → VolumeUnit → VolumeIsPeak → Status" })
  async getVolumeFlowSankeyData() {
    return this.metricsService.getVolumeFlowSankeyData();
  }

  @Get("sellers")
  @ApiOperation({ summary: "Get sellers metrics with sentiment distribution" })
  async getSellersMetrics(@Query() query: MetricsFilterDto) {
    return this.metricsService.getSellersMetrics(query);
  }

  @Get("sellers/:seller")
  @ApiOperation({ summary: "Get detailed metrics for a specific seller" })
  async getSellerDetails(@Param() params: GetSellerDetailsParamDto, @Query() query: MetricsFilterDto) {
    return this.metricsService.getSellerDetails(params.seller, { dateFrom: query.dateFrom, dateTo: query.dateTo });
  }

  @Get("sales-funnel-enhanced")
  @ApiOperation({ summary: "Get enhanced sales funnel with multi-dimensional analysis" })
  async getSalesFunnelEnhanced(@Query() query: MetricsFilterDto) {
    return this.metricsService.getSalesFunnelEnhanced(query);
  }

  @Get("sales-funnel-enhanced/insights")
  @ApiOperation({ summary: "Get AI-generated insights for the sales funnel" })
  async getSalesFunnelInsights(@Query() query: MetricsFilterDto) {
    return this.metricsService.getSalesFunnelInsights(query);
  }

  @Get("funnel-analysis")
  @ApiOperation({ summary: "Analyze funnel data quality and validity" })
  async analyzeFunnelDataQuality(@Query() query: MetricsFilterDto) {
    return this.metricsService.analyzeFunnelDataQuality(query);
  }

  @Get("closure-analysis")
  @ApiOperation({ summary: "Get closure analysis by categories with statistical significance" })
  async getClosureAnalysis(@Query() query: MetricsFilterDto) {
    return this.metricsService.getClosureAnalysis(query);
  }
}

