import { Integrations } from "@vambe/shared";
import { normalizeText } from "./normalizeText";

interface IntegrationsResult {
  integrations: Integrations[];
  confidence: number;
}

const INTEGRATION_KEYWORDS: Record<Integrations, string[]> = {
  [Integrations.CRM]: [
    "crm",
    "salesforce",
    "hubspot",
    "zoho",
    "sistema de clientes",
    "gestion de clientes",
  ],
  [Integrations.SISTEMA_CITAS]: [
    "sistema de citas",
    "agenda",
    "calendly",
    "reserva de citas",
    "gestion de citas",
    "programar citas",
    "disponibilidad de citas",
  ],
  [Integrations.ECOMMERCE]: [
    "ecommerce",
    "e-commerce",
    "tienda online",
    "tienda en linea",
    "shopify",
    "woocommerce",
    "magento",
    "ventas online",
    "ventas en linea",
  ],
  [Integrations.TICKETS]: [
    "tickets",
    "sistema de tickets",
    "zendesk",
    "freshdesk",
    "soporte tecnico",
    "helpdesk",
  ],
  [Integrations.RESERVAS]: [
    "reservas",
    "sistema de reservas",
    "booking",
    "gestion de reservas",
    "plataforma de reservas",
  ],
  [Integrations.ERP]: [
    "erp",
    "sap",
    "oracle",
    "odoo",
    "sistema empresarial",
  ],
  [Integrations.WHATSAPP]: [
    "whatsapp",
    "wsp",
    "mensajeria",
  ],
  [Integrations.BASE_DATOS]: [
    "base de datos",
    "database",
    "bases de datos",
    "integrar con nuestros sistemas",
    "sistemas actuales",
  ],
};

export function detectIntegrations(transcript: string): IntegrationsResult {
  const normalized = normalizeText(transcript);
  const detected: Set<Integrations> = new Set();

  for (const [integration, keywords] of Object.entries(INTEGRATION_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalized.includes(normalizedKeyword)) {
        detected.add(integration as Integrations);
        break;
      }
    }
  }

  const integrations = Array.from(detected);

  return {
    integrations,
    confidence: integrations.length > 0 ? 0.8 : 0,
  };
}
