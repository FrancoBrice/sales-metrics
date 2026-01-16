import { LeadSource } from "@vambe/shared";
import { normalizeText } from "./normalizeText";

interface LeadSourceResult {
  source: LeadSource | null;
  confidence: number;
}

const LEAD_SOURCE_PATTERNS: Record<LeadSource, RegExp[]> = {
  [LeadSource.LINKEDIN]: [
    /linkedin/i,
    /linked\s*in/i,
    /publicacion\s+en\s+linkedin/i,
  ],
  [LeadSource.GOOGLE]: [
    /google/i,
    /buscando\s+(en\s+)?google/i,
    /busqueda\s+online/i,
    /buscando\s+soluciones\s+online/i,
  ],
  [LeadSource.CONFERENCIA]: [
    /conferencia/i,
    /congreso/i,
    /seminario/i,
    /evento\s+de/i,
    /charla\s+sobre/i,
    /taller\s+sobre/i,
  ],
  [LeadSource.RECOMENDACION]: [
    /recomend/i,
    /colega/i,
    /amigo/i,
    /compan[iñ]ero/i,
    /mencion/i,
    /nos\s+hablo/i,
    /voluntario\s+nos\s+hablo/i,
  ],
  [LeadSource.WEBINAR]: [
    /webinar/i,
    /web\s*inar/i,
  ],
  [LeadSource.PODCAST]: [
    /podcast/i,
    /pod\s*cast/i,
  ],
  [LeadSource.FERIA]: [
    /feria/i,
    /expo/i,
    /exhibicion/i,
  ],
  [LeadSource.ARTICULO]: [
    /articulo/i,
    /publicacion/i,
    /blog/i,
    /lei\s+sobre/i,
    /leimos\s+sobre/i,
  ],
  [LeadSource.NETWORKING]: [
    /networking/i,
    /evento\s+de\s+networking/i,
  ],
  [LeadSource.REDES_SOCIALES]: [
    /redes\s+sociales/i,
    /instagram/i,
    /facebook/i,
    /twitter/i,
  ],
  [LeadSource.DESCONOCIDO]: [],
};

const FUZZY_MAPPINGS: Record<string, LeadSource> = {
  "conferencia tecnologia": LeadSource.CONFERENCIA,
  "conferencia de tecnologia": LeadSource.CONFERENCIA,
  "seminario fintech": LeadSource.CONFERENCIA,
  "feria empresarial": LeadSource.FERIA,
  "feria tecnologica": LeadSource.FERIA,
  "foro de": LeadSource.CONFERENCIA,
  "charla de": LeadSource.CONFERENCIA,
  "taller de": LeadSource.CONFERENCIA,
  "grupo de emprendedores": LeadSource.RECOMENDACION,
  "grupo de editores": LeadSource.RECOMENDACION,
};

export function detectLeadSource(transcript: string): LeadSourceResult {
  const normalized = normalizeText(transcript);

  for (const [source, patterns] of Object.entries(LEAD_SOURCE_PATTERNS)) {
    if (source === LeadSource.DESCONOCIDO) continue;

    for (const pattern of patterns) {
      if (pattern.test(transcript) || pattern.test(normalized)) {
        return {
          source: source as LeadSource,
          confidence: 0.9,
        };
      }
    }
  }

  for (const [keyword, source] of Object.entries(FUZZY_MAPPINGS)) {
    if (normalized.includes(keyword)) {
      return {
        source,
        confidence: 0.7,
      };
    }
  }

  return {
    source: LeadSource.DESCONOCIDO,
    confidence: 0.5,
  };
}
