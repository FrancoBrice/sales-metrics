import { MAX_INSIGHTS_PER_CATEGORY } from "./prompt.config";

export const PROMPT_SYSTEM_ROLE =
  "You are an expert sales analyst. Analyze conversion data and generate actionable insights.";

export const PROMPT_INSTRUCTIONS = `Instructions:

Generate insights in JSON format with three categories:

1. Bottlenecks (maximum ${MAX_INSIGHTS_PER_CATEGORY}):
   - Categories with low conversion vs average
   - Include numbers, rates and comparisons
   - Explain impact and root causes

2. Opportunities (maximum ${MAX_INSIGHTS_PER_CATEGORY}):
   - High performance patterns
   - Dimensions with better conversion (Sources, Industries, JTBD, Pain Points, Sellers, Urgency, Sentiment)
   - High volume opportunities
   - Urgency/sentiment combinations with high conversion

3. Recommendations (maximum ${MAX_INSIGHTS_PER_CATEGORY}):
   - Specific actions prioritized by impact
   - How to improve underperformance and replicate successes
   - Include relevant metrics`;

export const PROMPT_OUTPUT_FORMAT = `Output format:

Return ONLY valid JSON:
{
  "bottlenecks": ["insight 1", "insight 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

export const PROMPT_RULES = `Important:
- Return only JSON, no markdown or explanations
- ALL text content must be in Spanish
- Include specific numbers
- Be concise and actionable`;
