import { InsightsData } from "../../insights-client.interface";
import { FILTERS_LABELS } from "../section.labels";

type FiltersData = NonNullable<InsightsData["filters"]>;

export function buildFiltersSection(filters: FiltersData): string {
  const filterParts: string[] = [];

  if (filters.seller) {
    filterParts.push(`${FILTERS_LABELS.seller}: ${filters.seller}`);
  }

  if (filters.dateFrom) {
    filterParts.push(`${FILTERS_LABELS.dateFrom}: ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    filterParts.push(`${FILTERS_LABELS.dateTo}: ${filters.dateTo}`);
  }

  if (filterParts.length === 0) {
    return "";
  }

  return `${FILTERS_LABELS.applied}: ${filterParts.join(", ")}\n${FILTERS_LABELS.note}`;
}
