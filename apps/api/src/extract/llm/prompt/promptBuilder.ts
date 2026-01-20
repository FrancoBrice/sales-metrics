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

   - industry: Look for mentions of business sector, type of company, or industry keywords. Examples: "e-commerce", "retail", "healthcare", "fintech", "SaaS", "logistics"

   - businessModel: Identify how the company makes money. Look for: "B2B", "B2C", "marketplace", "subscription", "transaction-based", "freemium"

   - jtbdPrimary: Identify ALL primary jobs-to-be-done mentioned. Look for:
     * MULTIIDIOMA: mentions of "múltiples idiomas", "zonas horarias", "global", "internacional", "diferentes países"
     * ESCALABILIDAD: "crecer", "escalar", "aumentar volumen", "expansión"
     * AUTOMATIZACION: "automatizar", "reducir trabajo manual", "eficiencia", "procesos automáticos"
     * CALIDAD_ATENCION: "mejorar atención", "satisfacción cliente", "calidad servicio"
     * COSTOS: "reducir costos", "optimizar gastos", "ahorrar dinero"
     * TIEMPO_RESPUESTA: "respuesta rápida", "tiempo real", "inmediato", "urgente"

   - painPoints: Extract ALL pain points mentioned. Look for:
     * VOLUMEN_ALTO: "muchas consultas", "alto volumen", "demasiadas preguntas"
     * CONSULTAS_REPETITIVAS: "mismas preguntas", "repetitivo", "preguntas frecuentes"
     * SOBRECARGA_EQUIPO: "equipo sobrecargado", "mucho trabajo", "no damos abasto"
     * HORARIOS_LIMITADOS: "horarios", "disponibilidad", "24/7", "fuera de horario"
     * COSTOS_OPERATIVOS: "costos altos", "gasto en personal", "presupuesto"
     * CALIDAD_INCONSISTENTE: "inconsistencia", "calidad variable", "errores"
     * ESCALABILIDAD: "no podemos escalar", "crecimiento limitado", "capacidad"
     * INTEGRACIONES: "integración", "conectar sistemas", "compatibilidad"

   - leadSource: How did they find us? Look for: "referral", "web", "linkedin", "evento", "email", "cold call", "partner"

   - processMaturity: Assess their current process sophistication. Look for:
     * INICIAL: "empezando", "nuevo", "sin proceso", "manual"
     * BASICO: "algo estructurado", "proceso simple", "básico"
     * INTERMEDIO: "proceso definido", "estructurado", "documentado"
     * AVANZADO: "proceso maduro", "optimizado", "sophisticated"

   - toolingMaturity: What tools do they use? Look for:
     * MANUAL: "sin herramientas", "manual", "Excel", "papel"
     * BASICO: "herramientas básicas", "email", "spreadsheet"
     * INTERMEDIO: "CRM", "sistema básico", "herramientas estándar"
     * AVANZADO: "suite completa", "integración avanzada", "automatización"

   - knowledgeComplexity: How complex is their knowledge base? Look for:
     * SIMPLE: "preguntas simples", "información básica", "FAQ"
     * MODERADO: "algo complejo", "casos específicos", "reglas"
     * COMPLEJO: "muy complejo", "múltiples fuentes", "conocimiento especializado"

   - riskLevel: Assess project risk. Consider:
     * BAJO: "proyecto simple", "bajo riesgo", "pocos stakeholders"
     * MEDIO: "riesgo moderado", "algunos stakeholders", "complejidad media"
     * ALTO: "alto riesgo", "múltiples stakeholders", "crítico", "complejo"

   - integrations: Extract ALL integrations mentioned. Look for: "CRM", "WhatsApp", "API", "webhook", "Zapier", "Shopify", "WordPress", etc.

   - urgency: Time sensitivity. Look for:
     * BAJA: "no hay prisa", "eventualmente", "a futuro"
     * MEDIA: "pronto", "en los próximos meses", "planificando"
     * ALTA: "urgente", "necesitamos ya", "próximas semanas"
     * INMEDIATA: "inmediato", "ya mismo", "esta semana", "crítico"

   - successMetrics: What do they measure success by? Look for: "satisfacción", "tiempo respuesta", "volumen", "costos", "conversión", "retención"

   - objections: Extract ALL concerns raised. Look for:
     * CONFIDENCIALIDAD: "privacidad", "seguridad", "datos", "confidencial"
     * COSTO: "precio", "costoso", "presupuesto", "caro"
     * COMPLEJIDAD: "complejo", "difícil", "técnico", "implementación"
     * TIEMPO: "tiempo", "largo", "demora", "implementación"
     * COMPETENCIA: "competencia", "alternativa", "otra opción"

   - sentiment: Overall tone throughout conversation:
     * POSITIVO: enthusiastic, interested, positive language, "me gusta", "excelente"
     * NEUTRAL: balanced, neither positive nor negative, professional
     * ESCEPTICO: doubts, concerns, hesitant, "no estoy seguro", "tengo dudas"

   - volume: Extract quantity, unit, and if it's peak volume. Look for numbers with units like "consultas", "mensajes", "tickets", "interacciones", "usuarios". If they mention "picos" or "temporadas altas", set isPeak to true.

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
