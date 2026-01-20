import {
  Industry,
  BusinessModel,
  JtbdPrimary,
  PainPoints,
  LeadSource,
  ProcessMaturity,
  ToolingMaturity,
  KnowledgeComplexity,
  RiskLevel,
  Integrations,
  Urgency,
  SuccessMetric,
  Objections,
  Sentiment,
  VolumeUnit,
} from "@vambe/shared";
import { DeterministicHints } from "../clients/llmClient.interface";

const getEnumValues = (enumObject: Record<string, string>): string => {
  return Object.values(enumObject).join(", ");
};

function buildSchemaSection(): string {
  return `{
  "industry": "Industry enum value or null. Valid values: ${getEnumValues(Industry)}",
  "businessModel": "BusinessModel enum value or null. Valid values: ${getEnumValues(BusinessModel)}",
  "jtbdPrimary": ["array of JtbdPrimary enum values. Valid values: ${getEnumValues(JtbdPrimary)}"],
  "painPoints": ["array of PainPoints enum values. Valid values: ${getEnumValues(PainPoints)}"],
  "leadSource": "LeadSource enum value or null. Valid values: ${getEnumValues(LeadSource)}",
  "processMaturity": "ProcessMaturity enum value or null. Valid values: ${getEnumValues(ProcessMaturity)}",
  "toolingMaturity": "ToolingMaturity enum value or null. Valid values: ${getEnumValues(ToolingMaturity)}",
  "knowledgeComplexity": "KnowledgeComplexity enum value or null. Valid values: ${getEnumValues(KnowledgeComplexity)}",
  "riskLevel": "RiskLevel enum value or null. Valid values: ${getEnumValues(RiskLevel)}",
  "integrations": ["array of Integrations enum values. Valid values: ${getEnumValues(Integrations)}"],
  "urgency": "Urgency enum value or null. Valid values: ${getEnumValues(Urgency)}",
  "successMetrics": ["array of SuccessMetric enum values. Valid values: ${getEnumValues(SuccessMetric)}"],
  "objections": ["array of Objections enum values. Valid values: ${getEnumValues(Objections)}"],
  "sentiment": "Sentiment enum value or null. Valid values: ${getEnumValues(Sentiment)}",
  "volume": {
    "quantity": number or null,
    "unit": "VolumeUnit enum value or null. Valid values: ${getEnumValues(VolumeUnit)}",
    "isPeak": boolean
  } or null
}`;
}

function buildHintsSection(hints?: DeterministicHints): string {
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

  return `\n\n=== PRE-EXTRACTED VALUES ===
These values were extracted using deterministic methods. Use them as-is if they match the transcript context, otherwise extract from the transcript:
${hintParts.join("\n")}\n`;
}

function buildInstructionsSection(): string {
  return `=== EXTRACTION INSTRUCTIONS ===

1. ROLE: Act as an expert sales analyst specializing in B2B SaaS customer conversations. Your goal is to extract comprehensive information from sales meeting transcripts.

2. EXTRACTION GUIDELINES:
   - Extract ALL information explicitly mentioned OR clearly implied in the transcript
   - Look for indirect references, synonyms, and contextual clues
   - For arrays (jtbdPrimary, painPoints, integrations, etc.), include ALL relevant items found
   - Return empty arrays [] when no items are found (not null)
   - Be thorough: if information can be reasonably inferred from context, extract it

3. FIELD-SPECIFIC GUIDANCE (BE THOROUGH):

   - industry: Look for mentions of business sector, type of company, or industry keywords. Examples: "e-commerce", "retail", "healthcare" ("clínica", "hospital", "salud"), "fintech" ("servicios financieros", "financiera"), "SaaS", "logistics" ("logística", "transporte"), "educación" ("educativo", "centro educativo"), "hospitalidad" ("restaurante", "hotel"), "tecnología" ("startup tecnológica", "software"), "bienes raíces" ("inmobiliaria", "propiedades")

   - businessModel: Identify how the company makes money. Look for: "B2B", "B2C", "marketplace", "subscription", "transaction-based", "freemium"

   - jtbdPrimary: Identify ALL primary jobs-to-be-done mentioned. Valid enum values: ${getEnumValues(JtbdPrimary)}
     Extract the core goals they want to achieve. Examples:
     * AUTOMATIZAR_ATENCION: reducing manual work, automating customer service
     * REDUCIR_TIEMPOS: faster response times, real-time support
     * ESCALAR_OPERACIONES: handling growth, increasing capacity
     * MEJORAR_EXPERIENCIA: enhancing customer satisfaction, better service quality
     * LIBERAR_EQUIPO: freeing up team capacity, reducing workload
     * MULTIIDIOMA: multi-language support, international operations
     * DISPONIBILIDAD_24_7: around-the-clock availability, extended hours

   - painPoints: Extract ALL pain points mentioned. Valid enum values: ${getEnumValues(PainPoints)}
     Identify problems they're experiencing. Examples:
     * VOLUMEN_ALTO: too many inquiries, high volume
     * RESPUESTAS_LENTAS: slow response times, delays
     * FALTA_PERSONALIZACION: lack of personalization, generic responses
     * SOBRECARGA_EQUIPO: team overload, insufficient capacity
     * CONSULTAS_REPETITIVAS: repetitive questions, same queries
     * GESTION_MANUAL: manual processes, lack of automation
     * PICOS_DEMANDA: demand spikes, seasonal peaks
     * MULTICANAL: multiple channels to manage

   - leadSource: How did they find us? Valid enum values: ${getEnumValues(LeadSource)}
     Identify the channel or method. Examples:
     * LINKEDIN: LinkedIn posts or network
     * GOOGLE: online search, Google
     * CONFERENCIA: conferences, seminars, talks, workshops
     * RECOMENDACION: recommendations from colleagues, friends, or contacts
     * WEBINAR: webinars
     * PODCAST: podcasts
     * FERIA: trade shows, exhibitions
     * ARTICULO: articles, blog posts, publications
     * NETWORKING: networking events
     * REDES_SOCIALES: social media platforms
     * DESCONOCIDO: only when source cannot be determined

   - processMaturity: Assess their current process sophistication. Valid enum values: ${getEnumValues(ProcessMaturity)}
     * MANUAL: no structured processes, fully manual
     * PARCIALMENTE_AUTOMATIZADO: some automation, basic structure
     * AUTOMATIZADO: well-defined, documented, automated processes

   - toolingMaturity: What tools do they use? Valid enum values: ${getEnumValues(ToolingMaturity)}
     * SIN_HERRAMIENTAS: no tools, basic spreadsheets or manual methods
     * HERRAMIENTAS_BASICAS: email, simple tools, basic systems
     * CRM_INTEGRADO: CRM systems, integrated platforms, comprehensive tooling

   - knowledgeComplexity: How complex is their knowledge base? Valid enum values: ${getEnumValues(KnowledgeComplexity)}
     * SIMPLE: basic FAQs, straightforward information
     * MODERADA: some complexity, specific cases, moderate rules
     * COMPLEJA: highly complex, specialized knowledge, multiple sources

   - riskLevel: Assess project risk. Valid enum values: ${getEnumValues(RiskLevel)}
     Consider complexity, stakeholders, and criticality:
     * BAJO: simple project, few stakeholders, low risk
     * MEDIO: moderate complexity, standard project
     * ALTO: high complexity, multiple stakeholders, critical project

   - integrations: Extract ALL integrations mentioned. Valid enum values: ${getEnumValues(Integrations)}
     Identify systems they need to connect with (CRM, e-commerce platforms, booking systems, databases, etc.)

   - urgency: Time sensitivity. Valid enum values: ${getEnumValues(Urgency)}
     Assess time pressure from explicit mentions or contextual indicators:
     * BAJA: no rush, future consideration
     * MEDIA: planning phase, exploring options, general interest (default when unclear)
     * ALTA: active need, growth problems with time constraints, upcoming deadlines
     * INMEDIATA: critical urgency, immediate need, cannot wait

     When not explicit, infer from: growth issues + time constraints = ALTA; active search = MEDIA to ALTA; exploratory = MEDIA

   - successMetrics: What do they measure success by? Valid enum values: ${getEnumValues(SuccessMetric)}
     Extract metrics they care about (response time, volume, satisfaction, workload reduction, cost savings)

   - objections: Extract ALL concerns raised. Valid enum values: ${getEnumValues(Objections)}
     Identify concerns about: cost, integration challenges, confidentiality/security, personalization needs, complexity

   - sentiment: Overall tone throughout conversation. Valid enum values: ${getEnumValues(Sentiment)}
     Assess the OVERALL sentiment across the ENTIRE conversation, not just the end:
     * POSITIVO: Strong enthusiasm, excitement, clear commitment signals, proactive engagement about implementation or next steps. Requires genuine enthusiasm, not just basic interest or politeness.
     * NEUTRAL: Professional and courteous, but reserved. Shows interest without excitement. Standard exploratory conversation. This is the default for professional but non-enthusiastic conversations.
     * ESCEPTICO: Persistent concerns, doubts, hesitancy, or negative signals throughout the conversation. Significant reservations or objections that remain unresolved.

     IMPORTANT: Be strict with POSITIVO - it requires genuine enthusiasm and commitment signals. If the conversation is mostly neutral with some interest, use NEUTRAL. Consider the entire conversation tone, not just the final minutes.

   - volume: Extract quantity, unit, and if it's peak volume. Valid unit enum values: ${getEnumValues(VolumeUnit)}
     Look for numbers with units like "consultas", "mensajes", "tickets", "interacciones", "usuarios".
     Units: DIARIO (daily), SEMANAL (weekly), MENSUAL (monthly).
     If they mention "picos", "temporadas altas", "promociones", "épocas pico", set isPeak to true.

4. OUTPUT FORMAT:
   - Return ONLY valid JSON matching the schema
   - No explanatory text, comments, or markdown formatting
   - Ensure all enum values match exactly (case-sensitive)
   - Use null for optional single fields, [] for optional arrays
   - Be comprehensive: extract as much information as possible from the transcript`;
}

export function buildExtractionPrompt(
  transcript: string,
  hints?: DeterministicHints
): string {
  const schemaSection = buildSchemaSection();
  const hintsSection = buildHintsSection(hints);
  const instructionsSection = buildInstructionsSection();

  return `You are an expert sales analyst. Extract structured information from the sales meeting transcript below.

${instructionsSection}

=== OUTPUT SCHEMA ===
${schemaSection}
${hintsSection}
=== TRANSCRIPT ===
${transcript}

=== OUTPUT ===
Return only the JSON object matching the schema above. No additional text.`;
}
