import { buildFieldGuidanceSection } from "./field-guidance.builder";

export function buildInstructionsSection(): string {
  const fieldGuidance = buildFieldGuidanceSection();

  return `=== EXTRACTION INSTRUCTIONS ===

1. ROLE: Act as an expert sales analyst specializing in B2B SaaS customer conversations. Your goal is to extract comprehensive information from sales meeting transcripts.

2. EXTRACTION GUIDELINES:
   - Extract ALL information explicitly mentioned OR clearly implied in the transcript
   - Look for indirect references, synonyms, and contextual clues
   - For arrays (jtbdPrimary, painPoints, integrations, etc.), include ALL relevant items found
   - Return empty arrays [] when no items are found (not null)
   - Be thorough: if information can be reasonably inferred from context, extract it

3. FIELD-SPECIFIC GUIDANCE (BE THOROUGH):

${fieldGuidance}

4. OUTPUT FORMAT:
   - Return ONLY valid JSON matching the schema
   - No explanatory text, comments, or markdown formatting
   - Ensure all enum values match exactly (case-sensitive)
   - Use null for optional single fields, [] for optional arrays
   - Be comprehensive: extract as much information as possible from the transcript`;
}
