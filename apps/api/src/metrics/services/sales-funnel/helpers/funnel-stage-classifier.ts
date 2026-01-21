import { CustomerWithRelations } from "../../../../common/types";
import { Extraction } from "@vambe/shared";

export type StageCustomers = {
  stage1Leads: CustomerWithRelations[];
  stage2Qualified: CustomerWithRelations[];
  stage3NeedsAssessed: CustomerWithRelations[];
  stage4Proposal: CustomerWithRelations[];
  stage5Closure: CustomerWithRelations[];
};

export function classifyCustomersIntoStages(
  customers: CustomerWithRelations[],
  getExtraction: (customer: CustomerWithRelations) => Extraction | null
): StageCustomers {
  const stages: StageCustomers = {
    stage1Leads: [],
    stage2Qualified: [],
    stage3NeedsAssessed: [],
    stage4Proposal: [],
    stage5Closure: [],
  };

  for (const customer of customers) {
    if (customer.meetings.length === 0) {
      continue;
    }

    stages.stage1Leads.push(customer);

    const extraction = getExtraction(customer);
    if (!extraction) {
      continue;
    }

    if (hasQualificationData(extraction)) {
      stages.stage2Qualified.push(customer);
    }

    if (hasNeedsData(extraction)) {
      stages.stage3NeedsAssessed.push(customer);
    }

    if (hasProposalData(extraction)) {
      stages.stage4Proposal.push(customer);
    }

    if (hasClosureData(extraction)) {
      stages.stage5Closure.push(customer);
    }
  }

  return stages;
}

function hasQualificationData(extraction: Extraction): boolean {
  return !!(
    extraction.urgency ||
    extraction.riskLevel ||
    (extraction.jtbdPrimary && extraction.jtbdPrimary.length > 0)
  );
}

function hasNeedsData(extraction: Extraction): boolean {
  return !!(
    extraction.industry ||
    (extraction.painPoints && extraction.painPoints.length > 0) ||
    extraction.businessModel
  );
}

function hasProposalData(extraction: Extraction): boolean {
  return !!(
    (extraction.objections && extraction.objections.length > 0) ||
    extraction.processMaturity ||
    (extraction.integrations && extraction.integrations.length > 0)
  );
}

function hasClosureData(extraction: Extraction): boolean {
  return !!(
    extraction.sentiment ||
    (extraction.successMetrics && extraction.successMetrics.length > 0)
  );
}
