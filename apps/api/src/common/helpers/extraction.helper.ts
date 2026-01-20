import { CustomerWithRelations } from "../types";
import { mapExtractionDataToExtraction } from "../../extract/llm";
import { Extraction } from "@vambe/shared";

export function getExtractionFromCustomer(customer: CustomerWithRelations): Extraction | null {
  const meeting = customer.meetings[0];
  const extractionRecord = meeting?.extractions[0];

  if (!extractionRecord) {
    return null;
  }

  return mapExtractionDataToExtraction(extractionRecord.data);
}
