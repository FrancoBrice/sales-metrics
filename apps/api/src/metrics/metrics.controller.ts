import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { MetricsService } from "./metrics.service";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) { }

  @Get("overview")
  @ApiOperation({ summary: "Get aggregated metrics overview" })
  @ApiQuery({ name: "seller", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  async getOverview(
    @Query("seller") seller?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.metricsService.getOverview({ seller, dateFrom, dateTo });
  }

  @Get("by-dim")
  @ApiOperation({ summary: "Get metrics by dimension" })
  @ApiQuery({ name: "dimension", required: true, enum: ["leadSource", "industry", "seller", "painPoints"] })
  async getByDimension(@Query("dimension") dimension: string) {
    return this.metricsService.getByDimension(dimension);
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
  @ApiQuery({ name: "seller", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  async getLeadsOverTime(
    @Query("seller") seller?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.metricsService.getLeadsOverTime({
      seller,
      dateFrom,
      dateTo,
    });
  }
  @Get("sankey")
  @ApiOperation({ summary: "Get sankey diagram data" })
  async getSankeyData() {
    return this.metricsService.getSankeyData();
  }

  @Get("industry-painpoint-heatmap")
  @ApiOperation({ summary: "Get industry x pain point heatmap data" })
  @ApiQuery({ name: "seller", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  async getIndustryPainPointHeatmap(
    @Query("seller") seller?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.metricsService.getIndustryPainPointHeatmap({
      seller,
      dateFrom,
      dateTo,
    });
  }

  @Get("opportunity-matrix")
  @ApiOperation({ summary: "Get opportunity matrix: Volume vs Conversion Rate" })
  @ApiQuery({ name: "seller", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  async getOpportunityMatrix(
    @Query("seller") seller?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return this.metricsService.getOpportunityMatrix({
      seller,
      dateFrom,
      dateTo,
    });
  }
}

