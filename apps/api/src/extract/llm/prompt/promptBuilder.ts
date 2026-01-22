import { DeterministicHints } from "../clients/llmClient.interface";
import {
  buildSchemaSection,
  buildHintsSection,
  buildInstructionsSection,
} from "./builders";

const SYSTEM_ROLE = "You are an expert sales analyst. Extract structured information from the sales meeting transcript below.";

const OUTPUT_INSTRUCTION = "Return only the JSON object matching the schema above. No additional text.";

export function buildExtractionPrompt(
  transcript: string,
  hints?: DeterministicHints
): string {
  const schemaSection = buildSchemaSection();
  const hintsSection = buildHintsSection(hints);
  const instructionsSection = buildInstructionsSection();

  const promptParts = [
    SYSTEM_ROLE,
    instructionsSection,
    "=== OUTPUT SCHEMA ===",
    schemaSection,
    hintsSection,
    "=== TRANSCRIPT ===",
    transcript,
    "=== OUTPUT ===",
    OUTPUT_INSTRUCTION,
  ].filter((s) => s.length > 0);

  return promptParts.join("\n\n");
}
