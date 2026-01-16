import { Injectable } from "@nestjs/common";
import {
  Extraction,
  Industry,
  BusinessModel,
  JtbdPrimary,
  PainPoints,
  ProcessMaturity,
  ToolingMaturity,
  KnowledgeComplexity,
  RiskLevel,
  Urgency,
  SuccessMetric,
  Objections,
  Sentiment,
} from "@vambe/shared";
import { LlmClient } from "./llmClient.interface";
import { detectLeadSource, detectVolume, detectIntegrations } from "../deterministic";

@Injectable()
export class GeminiClientPlaceholder implements LlmClient {
  async extractFromTranscript(transcript: string): Promise<Extraction> {
    const leadSourceResult = detectLeadSource(transcript);
    const volumeResult = detectVolume(transcript);
    const integrationsResult = detectIntegrations(transcript);

    const industry = this.detectIndustry(transcript);
    const businessModel = this.detectBusinessModel(transcript);
    const painPoints = this.detectPainPoints(transcript);
    const jtbdPrimary = this.detectJtbd(transcript);

    return {
      industry,
      businessModel,
      jtbdPrimary,
      painPoints,
      leadSource: leadSourceResult.source,
      processMaturity: ProcessMaturity.MANUAL,
      toolingMaturity: ToolingMaturity.HERRAMIENTAS_BASICAS,
      knowledgeComplexity: KnowledgeComplexity.MODERADA,
      riskLevel: RiskLevel.MEDIO,
      integrations: integrationsResult.integrations,
      urgency: Urgency.MEDIA,
      successMetrics: [SuccessMetric.TIEMPO_RESPUESTA],
      objections: [],
      sentiment: Sentiment.POSITIVO,
      volume: volumeResult.volume,
      confidence: 0.7,
    };
  }

  private detectIndustry(transcript: string): Industry | null {
    const lower = transcript.toLowerCase();

    if (lower.includes("servicios financieros") || lower.includes("inversiones")) {
      return Industry.SERVICIOS_FINANCIEROS;
    }
    if (lower.includes("tienda online") || lower.includes("ecommerce") || lower.includes("articulos deportivos")) {
      return Industry.ECOMMERCE;
    }
    if (lower.includes("clinica") || lower.includes("salud") || lower.includes("pacientes") || lower.includes("odontolog")) {
      return Industry.SALUD;
    }
    if (lower.includes("educacion") || lower.includes("cursos") || lower.includes("estudiantes") || lower.includes("admision")) {
      return Industry.EDUCACION;
    }
    if (lower.includes("software") || lower.includes("tecnologia") || lower.includes("startup tecnolog")) {
      return Industry.TECNOLOGIA;
    }
    if (lower.includes("logistica") || lower.includes("envios") || lower.includes("transporte")) {
      return Industry.LOGISTICA;
    }
    if (lower.includes("turismo") || lower.includes("viajes") || lower.includes("tours")) {
      return Industry.TURISMO;
    }
    if (lower.includes("restaurante") || lower.includes("catering") || lower.includes("alimentos") || lower.includes("pasteleria")) {
      return Industry.ALIMENTOS;
    }
    if (lower.includes("moda") || lower.includes("ropa") || lower.includes("prendas")) {
      return Industry.MODA;
    }
    if (lower.includes("eventos") || lower.includes("conferencias")) {
      return Industry.EVENTOS;
    }
    if (lower.includes("consultoria") || lower.includes("asesoria")) {
      return Industry.CONSULTORIA;
    }
    if (lower.includes("legal") || lower.includes("abogados") || lower.includes("juridic")) {
      return Industry.LEGAL;
    }
    if (lower.includes("inmobiliaria") || lower.includes("propiedades") || lower.includes("bienes raices")) {
      return Industry.INMOBILIARIA;
    }
    if (lower.includes("marketing") || lower.includes("publicidad")) {
      return Industry.MARKETING;
    }
    if (lower.includes("arquitectura") || lower.includes("diseño de interiores")) {
      return Industry.ARQUITECTURA;
    }
    if (lower.includes("construccion")) {
      return Industry.CONSTRUCCION;
    }
    if (lower.includes("energia") || lower.includes("renovable")) {
      return Industry.ENERGIA;
    }
    if (lower.includes("agricola") || lower.includes("cultivos")) {
      return Industry.AGRICULTURA;
    }
    if (lower.includes("ong") || lower.includes("voluntario")) {
      return Industry.ONG;
    }

    return Industry.OTRO;
  }

  private detectBusinessModel(transcript: string): BusinessModel | null {
    const lower = transcript.toLowerCase();

    if (lower.includes("empresas") || lower.includes("corporativo") || lower.includes("b2b")) {
      return BusinessModel.B2B;
    }
    if (lower.includes("tienda online") || lower.includes("clientes finales") || lower.includes("consumidores")) {
      return BusinessModel.B2C;
    }

    return BusinessModel.B2B;
  }

  private detectPainPoints(transcript: string): PainPoints[] {
    const lower = transcript.toLowerCase();
    const painPoints: PainPoints[] = [];

    if (lower.includes("volumen") || lower.includes("cantidad de consultas") || lower.includes("muchas consultas")) {
      painPoints.push(PainPoints.VOLUMEN_ALTO);
    }
    if (lower.includes("demora") || lower.includes("tiempo de respuesta") || lower.includes("responder de inmediato")) {
      painPoints.push(PainPoints.RESPUESTAS_LENTAS);
    }
    if (lower.includes("sobrecarga") || lower.includes("saturado") || lower.includes("insuficiente") || lower.includes("no da abasto")) {
      painPoints.push(PainPoints.SOBRECARGA_EQUIPO);
    }
    if (lower.includes("repetitivas") || lower.includes("preguntas frecuentes")) {
      painPoints.push(PainPoints.CONSULTAS_REPETITIVAS);
    }
    if (lower.includes("manual") || lower.includes("gestion manual")) {
      painPoints.push(PainPoints.GESTION_MANUAL);
    }
    if (lower.includes("pico") || lower.includes("temporada alta") || lower.includes("promociones")) {
      painPoints.push(PainPoints.PICOS_DEMANDA);
    }

    return painPoints.length > 0 ? painPoints : [PainPoints.VOLUMEN_ALTO];
  }

  private detectJtbd(transcript: string): JtbdPrimary[] {
    const lower = transcript.toLowerCase();
    const jtbd: JtbdPrimary[] = [];

    if (lower.includes("automatizar") || lower.includes("automatizacion")) {
      jtbd.push(JtbdPrimary.AUTOMATIZAR_ATENCION);
    }
    if (lower.includes("rapidez") || lower.includes("rapidas") || lower.includes("tiempo")) {
      jtbd.push(JtbdPrimary.REDUCIR_TIEMPOS);
    }
    if (lower.includes("escalar") || lower.includes("crecimiento") || lower.includes("expandir")) {
      jtbd.push(JtbdPrimary.ESCALAR_OPERACIONES);
    }
    if (lower.includes("experiencia") || lower.includes("satisfaccion")) {
      jtbd.push(JtbdPrimary.MEJORAR_EXPERIENCIA);
    }
    if (lower.includes("liberar") || lower.includes("enfocarse en")) {
      jtbd.push(JtbdPrimary.LIBERAR_EQUIPO);
    }
    if (lower.includes("idioma") || lower.includes("internacional")) {
      jtbd.push(JtbdPrimary.MULTIIDIOMA);
    }

    return jtbd.length > 0 ? jtbd : [JtbdPrimary.AUTOMATIZAR_ATENCION];
  }
}
