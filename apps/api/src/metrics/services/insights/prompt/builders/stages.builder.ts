import { InsightsData } from "../../insights-client.interface";
import { STAGES_LABELS } from "../section.labels";

type StagesData = InsightsData["stages"];

export function buildStagesSection(stages: StagesData): string {
  if (stages.length === 0) return "";

  return stages
    .map((stage, index) => {
      const previousStage = index > 0 ? stages[index - 1] : null;
      const conversionFromPrevious =
        previousStage && previousStage.total > 0
          ? ((stage.total / previousStage.total) * 100).toFixed(1)
          : "100.0";

      return [
        `${stage.name}: ${stage.total} leads`,
        `${stage.closed} ${STAGES_LABELS.closed} (${stage.conversionRate.toFixed(1)}%)`,
        `${STAGES_LABELS.conversionFromPrevious}: ${conversionFromPrevious}%`,
        `${STAGES_LABELS.dropOff}: ${stage.dropOffRate.toFixed(1)}%`,
      ].join(", ");
    })
    .join("\n");
}
