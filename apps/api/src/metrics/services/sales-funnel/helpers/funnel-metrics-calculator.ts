import { CustomerWithRelations } from "../../../../common/types";
import { StageCustomers } from "./funnel-stage-classifier";

export type StageMetrics = {
  total: number;
  closed: number;
  conversionRate: number;
  dropOffRate: number;
};

export function calculateStageMetrics(stages: StageCustomers): {
  stage1: StageMetrics;
  stage2: StageMetrics;
  stage3: StageMetrics;
  stage4: StageMetrics;
  stage5: StageMetrics;
} {
  return {
    stage1: calculateBasicMetrics(stages.stage1Leads, []),
    stage2: calculateBasicMetrics(stages.stage2Qualified, stages.stage1Leads),
    stage3: calculateBasicMetrics(stages.stage3NeedsAssessed, stages.stage2Qualified),
    stage4: calculateBasicMetrics(stages.stage4Proposal, stages.stage3NeedsAssessed),
    stage5: calculateBasicMetrics(stages.stage5Closure, stages.stage4Proposal),
  };
}

function calculateBasicMetrics(
  stageCustomers: CustomerWithRelations[],
  previousStageCustomers: CustomerWithRelations[]
): StageMetrics {
  const total = stageCustomers.length;
  const closed = stageCustomers.filter((c) => c.closed).length;
  const conversionRate = calculateConversionRate(total, closed);
  const dropOffRate = previousStageCustomers.length > 0
    ? ((previousStageCustomers.length - total) / previousStageCustomers.length) * 100
    : 0;

  return {
    total,
    closed,
    conversionRate: roundToOneDecimal(conversionRate),
    dropOffRate: roundToOneDecimal(dropOffRate),
  };
}

function calculateConversionRate(total: number, closed: number): number {
  return total > 0 ? (closed / total) * 100 : 0;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
