import { Injectable } from "@nestjs/common";
import { MetricsFilterDto } from "./dto/metrics-filter.dto";
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

@Injectable()
export class MetricsService {
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
    private readonly salesFunnelService: SalesFunnelService
  ) {}

  async getOverview(filter: MetricsFilterDto) {
    return this.overviewService.getOverview(filter);
  }

  async getByDimension(dimension: string) {
    return this.byDimensionService.getByDimension(dimension);
  }

  async getConversionFunnel() {
    return this.conversionFunnelService.getConversionFunnel();
  }

  async getVolumeDistribution() {
    return this.volumeDistributionService.getVolumeDistribution();
  }

  async getLeadsOverTime(filter: MetricsFilterDto) {
    return this.leadsOverTimeService.getLeadsOverTime(filter);
  }

  async getSankeyData() {
    return this.sankeyService.getSankeyData();
  }

  async getIndustryPainPointHeatmap(filter: MetricsFilterDto) {
    return this.industryPainPointHeatmapService.getIndustryPainPointHeatmap(filter);
  }

  async getOpportunityMatrix(filter: MetricsFilterDto) {
    return this.opportunityMatrixService.getOpportunityMatrix(filter);
  }

  async getWinProbabilityMatrix(filter: MetricsFilterDto) {
    return this.winProbabilityService.getWinProbabilityMatrix(filter);
  }

  async getVolumeFlowSankeyData() {
    return this.volumeFlowService.getVolumeFlowSankeyData();
  }

  async getSellersMetrics(filter: MetricsFilterDto) {
    return this.sellersService.getSellersMetrics(filter);
  }

  async getSellerDetails(seller: string, filter: MetricsFilterDto) {
    return this.sellersService.getSellerDetails(seller, filter);
  }

  async getSalesFunnelEnhanced(filter: MetricsFilterDto) {
    return this.salesFunnelService.getSalesFunnelEnhanced(filter);
  }

  async getSalesFunnelInsights(filter: MetricsFilterDto) {
    return this.salesFunnelService.getSalesFunnelInsights(filter);
  }
}
