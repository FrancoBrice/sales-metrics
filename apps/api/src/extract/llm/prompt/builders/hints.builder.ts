import { DeterministicHints } from "../../clients/llmClient.interface";

export function buildHintsSection(hints?: DeterministicHints): string {
  if (!hints) {
    return "";
  }

  const hintParts: string[] = [];

  if (hints.leadSource) {
    hintParts.push(`leadSource: "${hints.leadSource}"`);
  }

  if (hints.volume) {
    const vol = hints.volume;
    hintParts.push(
      `volume: { quantity: ${vol.quantity}, unit: "${vol.unit}", isPeak: ${vol.isPeak} }`
    );
  }

  if (hints.integrations && hints.integrations.length > 0) {
    hintParts.push(`integrations: [${hints.integrations.map((i) => `"${i}"`).join(", ")}]`);
  }

  if (hintParts.length === 0) {
    return "";
  }

  return `

=== PRE-EXTRACTED VALUES ===
These values were extracted using deterministic methods. Use them as-is if they match the transcript context, otherwise extract from the transcript:
${hintParts.join("\n")}
`;
}
