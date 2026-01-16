import { Volume, VolumeUnit } from "@vambe/shared";
import { normalizeText } from "./normalizeText";

interface VolumeResult {
  volume: Volume | null;
  confidence: number;
}

const VOLUME_PATTERNS = [
  {
    pattern: /(\d+)\s*(interacciones?|mensajes?|consultas?)\s*(diarias?|al\s*dia)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: false,
  },
  {
    pattern: /(\d+)\s*(interacciones?|mensajes?|consultas?)\s*(semanales?|a\s*la\s*semana)/i,
    unit: VolumeUnit.SEMANAL,
    isPeak: false,
  },
  {
    pattern: /(\d+)\s*(interacciones?|mensajes?|consultas?)\s*(mensuales?|al\s*mes)/i,
    unit: VolumeUnit.MENSUAL,
    isPeak: false,
  },
  {
    pattern: /mas\s*de\s*(\d+)\s*(mensajes?|interacciones?|consultas?)\s*(diarios?|al\s*dia)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: false,
  },
  {
    pattern: /mas\s*de\s*(\d+)\s*(mensajes?|interacciones?|consultas?)\s*(semanales?)/i,
    unit: VolumeUnit.SEMANAL,
    isPeak: false,
  },
  {
    pattern: /cerca\s*de\s*(\d+)\s*(interacciones?|mensajes?|consultas?)/i,
    unit: VolumeUnit.SEMANAL,
    isPeak: false,
  },
  {
    pattern: /alrededor\s*de\s*(\d+)\s*(interacciones?|mensajes?|consultas?)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: false,
  },
  {
    pattern: /superar?\s*(los\s*)?(\d+)\s*(mensajes?|interacciones?)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: true,
  },
  {
    pattern: /llegar?\s*a\s*(\d+)\s*(mensajes?|interacciones?|consultas?)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: true,
  },
  {
    pattern: /pico.*?(\d+)\s*(mensajes?|interacciones?|consultas?)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: true,
  },
  {
    pattern: /durante\s*(las\s*)?(promociones?|temporadas?\s*altas?).*?(\d+)/i,
    unit: VolumeUnit.DIARIO,
    isPeak: true,
  },
];

const DAILY_INDICATORS = [
  /diarias?/i,
  /al\s*dia/i,
  /por\s*dia/i,
  /cada\s*dia/i,
];

const WEEKLY_INDICATORS = [
  /semanales?/i,
  /a\s*la\s*semana/i,
  /por\s*semana/i,
];

const PEAK_INDICATORS = [
  /pico/i,
  /temporada\s*alta/i,
  /promocion/i,
  /durante\s*(las\s*)?promociones/i,
  /epocas?\s*pico/i,
  /puede\s*(llegar|superar)/i,
];

export function detectVolume(transcript: string): VolumeResult {
  const normalized = normalizeText(transcript);

  for (const { pattern, unit, isPeak } of VOLUME_PATTERNS) {
    const match = transcript.match(pattern) || normalized.match(pattern);
    if (match) {
      const quantityStr = match[1] || match[2] || match[3];
      const quantity = parseInt(quantityStr, 10);

      if (!isNaN(quantity)) {
        const hasPeakIndicator = PEAK_INDICATORS.some((p) => p.test(transcript));

        return {
          volume: {
            quantity,
            unit,
            isPeak: isPeak || hasPeakIndicator,
          },
          confidence: 0.85,
        };
      }
    }
  }

  const numberMatch = transcript.match(/(\d+)\s*(interacciones?|mensajes?|consultas?)/i);
  if (numberMatch) {
    const quantity = parseInt(numberMatch[1], 10);
    let unit = VolumeUnit.SEMANAL;

    if (DAILY_INDICATORS.some((p) => p.test(transcript))) {
      unit = VolumeUnit.DIARIO;
    } else if (WEEKLY_INDICATORS.some((p) => p.test(transcript))) {
      unit = VolumeUnit.SEMANAL;
    }

    const isPeak = PEAK_INDICATORS.some((p) => p.test(transcript));

    return {
      volume: {
        quantity,
        unit,
        isPeak,
      },
      confidence: 0.6,
    };
  }

  return {
    volume: null,
    confidence: 0,
  };
}
