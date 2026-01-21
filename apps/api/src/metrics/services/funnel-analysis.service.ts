import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { MetricsFilterDto } from "../dto/metrics-filter.dto";
import { BaseMetricsService } from "./base-metrics.service";
import { CustomerWithRelations } from "../../common/types";

@Injectable()
export class FunnelAnalysisService extends BaseMetricsService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async analyzeFunnelDataQuality(filter: MetricsFilterDto) {
    const customers = await this.getCustomers(filter);
    const customersWithMeetings = customers.filter((c) => c.meetings.length > 0);

    const analysis = {
      totalCustomers: customersWithMeetings.length,
      totalClosed: customersWithMeetings.filter((c) => c.closed).length,
      stageOverlap: {
        leadGeneration: 0,
        qualification: 0,
        needsAssessment: 0,
        proposalDevelopment: 0,
        closure: 0,
      },
      exclusiveStageCounts: {
        onlyStage1: 0,
        onlyStage2: 0,
        onlyStage3: 0,
        onlyStage4: 0,
        onlyStage5: 0,
        multipleStages: 0,
      },
      closedDistribution: {
        inStage1: 0,
        inStage2: 0,
        inStage3: 0,
        inStage4: 0,
        inStage5: 0,
      },
      dataCompleteness: {
        withExtraction: 0,
        withQualification: 0,
        withNeeds: 0,
        withProposal: 0,
        withClosure: 0,
      },
      flowAnalysis: {
        stage1To2: { possible: 0, actual: 0 },
        stage2To3: { possible: 0, actual: 0 },
        stage3To4: { possible: 0, actual: 0 },
        stage4To5: { possible: 0, actual: 0 },
      },
    };

    const stageSets = {
      stage1: new Set<string>(),
      stage2: new Set<string>(),
      stage3: new Set<string>(),
      stage4: new Set<string>(),
      stage5: new Set<string>(),
    };

    for (const customer of customersWithMeetings) {
      const extraction = this.getExtraction(customer);
      const customerId = customer.id;

      stageSets.stage1.add(customerId);

      if (!extraction) {
        continue;
      }

      analysis.dataCompleteness.withExtraction++;

      const hasQualificationData =
        extraction.urgency ||
        extraction.riskLevel ||
        (extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0);
      const hasNeedsData =
        extraction.industry ||
        (extraction.painPoints && extraction.painPoints.length > 0) ||
        extraction.businessModel;
      const hasProposalData =
        (extraction.objections && extraction.objections.length > 0) ||
        extraction.processMaturity ||
        (extraction.integrations && extraction.integrations.length > 0);
      const hasClosureData =
        extraction.sentiment ||
        (extraction.successMetrics && extraction.successMetrics.length > 0);

      if (hasQualificationData) {
        stageSets.stage2.add(customerId);
        analysis.dataCompleteness.withQualification++;
        if (customer.closed) {
          analysis.closedDistribution.inStage2++;
        }
      }

      if (hasNeedsData) {
        stageSets.stage3.add(customerId);
        analysis.dataCompleteness.withNeeds++;
        if (customer.closed) {
          analysis.closedDistribution.inStage3++;
        }
      }

      if (hasProposalData) {
        stageSets.stage4.add(customerId);
        analysis.dataCompleteness.withProposal++;
        if (customer.closed) {
          analysis.closedDistribution.inStage4++;
        }
      }

      if (hasClosureData) {
        stageSets.stage5.add(customerId);
        analysis.dataCompleteness.withClosure++;
        if (customer.closed) {
          analysis.closedDistribution.inStage5++;
        }
      }

      if (customer.closed) {
        analysis.closedDistribution.inStage1++;
      }

      const stagesIn = [
        stageSets.stage1.has(customerId),
        stageSets.stage2.has(customerId),
        stageSets.stage3.has(customerId),
        stageSets.stage4.has(customerId),
        stageSets.stage5.has(customerId),
      ];

      const stageCount = stagesIn.filter(Boolean).length;

      if (stageCount === 1) {
        if (stageSets.stage1.has(customerId) && !stageSets.stage2.has(customerId)) {
          analysis.exclusiveStageCounts.onlyStage1++;
        } else if (
          stageSets.stage2.has(customerId) &&
          !stageSets.stage3.has(customerId) &&
          !stageSets.stage1.has(customerId)
        ) {
          analysis.exclusiveStageCounts.onlyStage2++;
        }
      } else if (stageCount > 1) {
        analysis.exclusiveStageCounts.multipleStages++;
      }
    }

    analysis.stageOverlap.leadGeneration = stageSets.stage1.size;
    analysis.stageOverlap.qualification = stageSets.stage2.size;
    analysis.stageOverlap.needsAssessment = stageSets.stage3.size;
    analysis.stageOverlap.proposalDevelopment = stageSets.stage4.size;
    analysis.stageOverlap.closure = stageSets.stage5.size;

    analysis.flowAnalysis.stage1To2.possible = stageSets.stage1.size;
    analysis.flowAnalysis.stage1To2.actual = stageSets.stage2.size;

    analysis.flowAnalysis.stage2To3.possible = stageSets.stage2.size;
    analysis.flowAnalysis.stage2To3.actual = stageSets.stage3.size;

    analysis.flowAnalysis.stage3To4.possible = stageSets.stage3.size;
    analysis.flowAnalysis.stage3To4.actual = stageSets.stage4.size;

    analysis.flowAnalysis.stage4To5.possible = stageSets.stage4.size;
    analysis.flowAnalysis.stage4To5.actual = stageSets.stage5.size;

    const isRealFunnel = this.evaluateFunnelValidity(analysis);

    return {
      ...analysis,
      evaluation: isRealFunnel,
    };
  }

  private evaluateFunnelValidity(analysis: {
    flowAnalysis: {
      stage1To2: { possible: number; actual: number };
      stage2To3: { possible: number; actual: number };
      stage3To4: { possible: number; actual: number };
      stage4To5: { possible: number; actual: number };
    };
  }) {
    const flowRates = {
      stage1To2: analysis.flowAnalysis.stage1To2.possible > 0
        ? analysis.flowAnalysis.stage1To2.actual / analysis.flowAnalysis.stage1To2.possible
        : 0,
      stage2To3: analysis.flowAnalysis.stage2To3.possible > 0
        ? analysis.flowAnalysis.stage2To3.actual / analysis.flowAnalysis.stage2To3.possible
        : 0,
      stage3To4: analysis.flowAnalysis.stage3To4.possible > 0
        ? analysis.flowAnalysis.stage3To4.actual / analysis.flowAnalysis.stage3To4.possible
        : 0,
      stage4To5: analysis.flowAnalysis.stage4To5.possible > 0
        ? analysis.flowAnalysis.stage4To5.actual / analysis.flowAnalysis.stage4To5.possible
        : 0,
    };

    const hasReverseFlow = Object.values(flowRates).some((rate) => rate > 1);
    const hasValidProgression = Object.values(flowRates).every((rate) => rate <= 1 && rate >= 0);

    return {
      isRealFunnel: !hasReverseFlow && hasValidProgression,
      hasReverseFlow,
      flowRates,
      recommendation:
        hasReverseFlow || !hasValidProgression
          ? "Este no es un embudo real de conversión. Las etapas no son secuenciales y hay superposición. Considera cambiar a visualización de 'completitud de datos' o crear un embudo basado en estados/tiempo real."
          : "El embudo muestra una progresión válida.",
    };
  }
}
