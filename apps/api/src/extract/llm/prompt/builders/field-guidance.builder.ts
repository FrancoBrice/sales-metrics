import { EXTRACTION_ENUMS, getEnumValues } from "../extraction.enums";

const e = EXTRACTION_ENUMS;

interface FieldGuidance {
  field: string;
  description: string;
  enumValues?: string;
  examples?: string[];
}

const FIELD_GUIDANCE: FieldGuidance[] = [
  {
    field: "industry",
    description: "Look for mentions of business sector, type of company, or industry keywords",
    examples: [
      '"e-commerce", "retail"',
      '"healthcare" ("clínica", "hospital", "salud")',
      '"fintech" ("servicios financieros", "financiera")',
      '"SaaS"',
      '"logistics" ("logística", "transporte")',
      '"educación" ("educativo", "centro educativo")',
      '"hospitalidad" ("restaurante", "hotel")',
      '"tecnología" ("startup tecnológica", "software")',
      '"bienes raíces" ("inmobiliaria", "propiedades")',
    ],
  },
  {
    field: "businessModel",
    description: "Identify how the company makes money",
    examples: ['"B2B", "B2C", "marketplace", "subscription", "transaction-based", "freemium"'],
  },
  {
    field: "jtbdPrimary",
    description: "Identify ALL primary jobs-to-be-done mentioned. Extract the core goals they want to achieve",
    enumValues: getEnumValues(e.jtbdPrimary),
    examples: [
      "AUTOMATIZAR_ATENCION: reducing manual work, automating customer service",
      "REDUCIR_TIEMPOS: faster response times, real-time support",
      "ESCALAR_OPERACIONES: handling growth, increasing capacity",
      "MEJORAR_EXPERIENCIA: enhancing customer satisfaction, better service quality",
      "LIBERAR_EQUIPO: freeing up team capacity, reducing workload",
      "MULTIIDIOMA: multi-language support, international operations",
      "DISPONIBILIDAD_24_7: around-the-clock availability, extended hours",
    ],
  },
  {
    field: "painPoints",
    description: "Extract ALL pain points mentioned. Identify problems they're experiencing",
    enumValues: getEnumValues(e.painPoints),
    examples: [
      "VOLUMEN_ALTO: too many inquiries, high volume",
      "RESPUESTAS_LENTAS: slow response times, delays",
      "FALTA_PERSONALIZACION: lack of personalization, generic responses",
      "SOBRECARGA_EQUIPO: team overload, insufficient capacity",
      "CONSULTAS_REPETITIVAS: repetitive questions, same queries",
      "GESTION_MANUAL: manual processes, lack of automation",
      "PICOS_DEMANDA: demand spikes, seasonal peaks",
      "MULTICANAL: multiple channels to manage",
    ],
  },
  {
    field: "leadSource",
    description: "How did they find us? Identify the channel or method",
    enumValues: getEnumValues(e.leadSource),
    examples: [
      "LINKEDIN: LinkedIn posts or network",
      "GOOGLE: online search, Google",
      "CONFERENCIA: conferences, seminars, talks, workshops",
      "RECOMENDACION: recommendations from colleagues, friends, or contacts",
      "WEBINAR: webinars",
      "PODCAST: podcasts",
      "FERIA: trade shows, exhibitions",
      "ARTICULO: articles, blog posts, publications",
      "NETWORKING: networking events",
      "REDES_SOCIALES: social media platforms",
      "DESCONOCIDO: only when source cannot be determined",
    ],
  },
  {
    field: "processMaturity",
    description: "Assess their current process sophistication",
    enumValues: getEnumValues(e.processMaturity),
    examples: [
      "MANUAL: no structured processes, fully manual",
      "PARCIALMENTE_AUTOMATIZADO: some automation, basic structure",
      "AUTOMATIZADO: well-defined, documented, automated processes",
    ],
  },
  {
    field: "toolingMaturity",
    description: "What tools do they use?",
    enumValues: getEnumValues(e.toolingMaturity),
    examples: [
      "SIN_HERRAMIENTAS: no tools, basic spreadsheets or manual methods",
      "HERRAMIENTAS_BASICAS: email, simple tools, basic systems",
      "CRM_INTEGRADO: CRM systems, integrated platforms, comprehensive tooling",
    ],
  },
  {
    field: "knowledgeComplexity",
    description: "How complex is their knowledge base?",
    enumValues: getEnumValues(e.knowledgeComplexity),
    examples: [
      "SIMPLE: basic FAQs, straightforward information",
      "MODERADA: some complexity, specific cases, moderate rules",
      "COMPLEJA: highly complex, specialized knowledge, multiple sources",
    ],
  },
  {
    field: "riskLevel",
    description: "Assess project risk. Consider complexity, stakeholders, and criticality",
    enumValues: getEnumValues(e.riskLevel),
    examples: [
      "BAJO: simple project, few stakeholders, low risk",
      "MEDIO: moderate complexity, standard project",
      "ALTO: high complexity, multiple stakeholders, critical project",
    ],
  },
  {
    field: "integrations",
    description: "Extract ALL integrations mentioned. Identify systems they need to connect with (CRM, e-commerce platforms, booking systems, databases, etc.)",
    enumValues: getEnumValues(e.integrations),
  },
  {
    field: "urgency",
    description: "Time sensitivity. Assess time pressure from explicit mentions or contextual indicators",
    enumValues: getEnumValues(e.urgency),
    examples: [
      "BAJA: no rush, future consideration",
      "MEDIA: planning phase, exploring options, general interest (default when unclear)",
      "ALTA: active need, growth problems with time constraints, upcoming deadlines",
      "INMEDIATA: critical urgency, immediate need, cannot wait",
      "Inference: growth issues + time constraints = ALTA; active search = MEDIA to ALTA; exploratory = MEDIA",
    ],
  },
  {
    field: "successMetrics",
    description: "What do they measure success by? Extract metrics they care about (response time, volume, satisfaction, workload reduction, cost savings)",
    enumValues: getEnumValues(e.successMetrics),
  },
  {
    field: "objections",
    description: "Extract ALL concerns raised. Identify concerns about: cost, integration challenges, confidentiality/security, personalization needs, complexity",
    enumValues: getEnumValues(e.objections),
  },
  {
    field: "sentiment",
    description: "Overall tone throughout the ENTIRE conversation. Look for specific verbal signals and behavioral patterns",
    enumValues: getEnumValues(e.sentiment),
    examples: [
      "POSITIVO signals - Use when you find phrases like:",
      '  * "Me encanta", "Esto es exactamente lo que necesitamos", "Cuándo podemos empezar?"',
      '  * "Estoy muy emocionado", "Wow", "Increíble", "Perfecto"',
      "  * Asking about pricing/contracts proactively, discussing implementation timeline",
      "  * Requesting demos, trials, or next meeting dates",
      "  * Sharing the solution internally, mentioning decision-makers positively",
      "",
      "NEUTRAL signals - Use when conversation is:",
      '  * Polite but transactional: "Gracias por la información", "Lo vamos a evaluar"',
      '  * Information-gathering without commitment: "Cuéntame más", "Cómo funciona?"',
      "  * Standard professional courtesy without enthusiasm",
      "  * No explicit positive or negative indicators",
      "",
      "ESCEPTICO signals - Use when you find:",
      '  * "No estoy seguro", "Tengo dudas", "Me preocupa que..."',
      "  * Repeated objections about price, complexity, or timing",
      "  * Comparisons with competitors in a negative tone",
      "  * Hesitation about next steps, avoiding commitment",
      "  * Mentions of past failures with similar solutions",
      "",
      "DECISION RULE: Count positive vs negative signals. If mostly positive → POSITIVO. If mixed or none → NEUTRAL. If mostly concerns → ESCEPTICO",
    ],
  },
  {
    field: "volume",
    description: 'Extract quantity, unit, and if it\'s peak volume. Look for numbers with units like "consultas", "mensajes", "tickets", "interacciones", "usuarios"',
    enumValues: getEnumValues(e.volumeUnit),
    examples: [
      "Units: DIARIO (daily), SEMANAL (weekly), MENSUAL (monthly)",
      'If they mention "picos", "temporadas altas", "promociones", "épocas pico", set isPeak to true',
    ],
  },
];

function formatFieldGuidance(field: FieldGuidance): string {
  const lines: string[] = [`   - ${field.field}: ${field.description}`];

  if (field.enumValues) {
    lines[0] += `. Valid enum values: ${field.enumValues}`;
  }

  if (field.examples && field.examples.length > 0) {
    field.examples.forEach((example) => {
      lines.push(`     * ${example}`);
    });
  }

  return lines.join("\n");
}

export function buildFieldGuidanceSection(): string {
  return FIELD_GUIDANCE.map(formatFieldGuidance).join("\n\n");
}
