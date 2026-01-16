import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  Extraction,
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
import { LlmClient } from "./llmClient.interface";
import { detectLeadSource, detectVolume, detectIntegrations } from "../deterministic";
import { tryParseJson } from "./jsonRepair";

const EXTRACTION_PROMPT = `Eres un experto en análisis de reuniones de ventas B2B. Analiza la siguiente transcripción de una reunión de ventas y extrae información estructurada.

La empresa Vambe ofrece soluciones de automatización de atención al cliente mediante IA conversacional.

Transcripción:
{transcript}

Extrae la siguiente información en formato JSON:

1. **industry**: La industria del cliente potencial. Valores posibles: ${Object.values(Industry).join(", ")}

2. **businessModel**: Modelo de negocio del cliente. Valores posibles: ${Object.values(BusinessModel).join(", ")}

3. **jtbdPrimary**: Jobs-to-be-done principales que el cliente quiere resolver (array). Valores posibles: ${Object.values(JtbdPrimary).join(", ")}

4. **painPoints**: Puntos de dolor mencionados (array). Valores posibles: ${Object.values(PainPoints).join(", ")}

5. **leadSource**: Cómo conoció el cliente a Vambe. Valores posibles: ${Object.values(LeadSource).join(", ")}

6. **processMaturity**: Nivel de madurez de sus procesos actuales. Valores posibles: ${Object.values(ProcessMaturity).join(", ")}

7. **toolingMaturity**: Nivel de herramientas tecnológicas que usan. Valores posibles: ${Object.values(ToolingMaturity).join(", ")}

8. **knowledgeComplexity**: Complejidad del conocimiento requerido para responder consultas. Valores posibles: ${Object.values(KnowledgeComplexity).join(", ")}

9. **riskLevel**: Nivel de riesgo percibido en la implementación. Valores posibles: ${Object.values(RiskLevel).join(", ")}

10. **integrations**: Integraciones mencionadas o necesarias (array). Valores posibles: ${Object.values(Integrations).join(", ")}

11. **urgency**: Nivel de urgencia del cliente. Valores posibles: ${Object.values(Urgency).join(", ")}

12. **successMetrics**: Métricas de éxito mencionadas (array). Valores posibles: ${Object.values(SuccessMetric).join(", ")}

13. **objections**: Objeciones o preocupaciones mencionadas (array). Valores posibles: ${Object.values(Objections).join(", ")}

14. **sentiment**: Sentimiento general del cliente hacia Vambe. Valores posibles: ${Object.values(Sentiment).join(", ")}

15. **volume**: Objeto con:
    - quantity: número de interacciones mencionadas (null si no se menciona)
    - unit: unidad de tiempo. Valores posibles: ${Object.values(VolumeUnit).join(", ")}
    - isPeak: boolean indicando si es volumen pico o normal

16. **confidence**: Tu nivel de confianza en la extracción (0.0 a 1.0)

Responde SOLO con el JSON, sin explicaciones adicionales.`;

@Injectable()
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = "gemini-2.0-flash-exp";

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is required. Please configure your Gemini API key in the environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromTranscript(transcript: string): Promise<Extraction> {

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const prompt = EXTRACTION_PROMPT.replace("{transcript}", transcript);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in Gemini API response");
      }

      const parsed = tryParseJson<Partial<Extraction>>(jsonMatch[0]);
      if (!parsed) {
        throw new Error("Failed to parse JSON from Gemini API response");
      }

      return this.validateAndMerge(parsed, transcript);
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error}`);
      throw new Error(`Gemini API extraction failed: ${error}`);
    }
  }

  private validateAndMerge(llmResult: Partial<Extraction>, transcript: string): Extraction {
    const deterministicLeadSource = detectLeadSource(transcript);
    const deterministicVolume = detectVolume(transcript);
    const deterministicIntegrations = detectIntegrations(transcript);

    const leadSource =
      llmResult.leadSource && Object.values(LeadSource).includes(llmResult.leadSource)
        ? llmResult.leadSource
        : deterministicLeadSource.source;

    const volume = llmResult.volume || deterministicVolume.volume;

    const llmIntegrations = (llmResult.integrations || []).filter(
      (i) => Object.values(Integrations).includes(i)
    );
    const integrations = llmIntegrations.length > 0
      ? llmIntegrations
      : deterministicIntegrations.integrations;

    return {
      industry: this.validateEnum(llmResult.industry, Industry) || Industry.OTRO,
      businessModel: this.validateEnum(llmResult.businessModel, BusinessModel) || BusinessModel.B2B,
      jtbdPrimary: this.validateEnumArray(llmResult.jtbdPrimary, JtbdPrimary, [JtbdPrimary.AUTOMATIZAR_ATENCION]),
      painPoints: this.validateEnumArray(llmResult.painPoints, PainPoints, [PainPoints.VOLUMEN_ALTO]),
      leadSource,
      processMaturity: this.validateEnum(llmResult.processMaturity, ProcessMaturity) || ProcessMaturity.MANUAL,
      toolingMaturity: this.validateEnum(llmResult.toolingMaturity, ToolingMaturity) || ToolingMaturity.HERRAMIENTAS_BASICAS,
      knowledgeComplexity: this.validateEnum(llmResult.knowledgeComplexity, KnowledgeComplexity) || KnowledgeComplexity.MODERADA,
      riskLevel: this.validateEnum(llmResult.riskLevel, RiskLevel) || RiskLevel.MEDIO,
      integrations,
      urgency: this.validateEnum(llmResult.urgency, Urgency) || Urgency.MEDIA,
      successMetrics: this.validateEnumArray(llmResult.successMetrics, SuccessMetric, [SuccessMetric.TIEMPO_RESPUESTA]),
      objections: this.validateEnumArray(llmResult.objections, Objections, []),
      sentiment: this.validateEnum(llmResult.sentiment, Sentiment) || Sentiment.POSITIVO,
      volume,
      confidence: typeof llmResult.confidence === "number" ? Math.min(1, Math.max(0, llmResult.confidence)) : 0.8,
    };
  }

  private validateEnum<T extends string>(value: T | null | undefined, enumObj: Record<string, T>): T | null {
    if (!value) return null;
    return Object.values(enumObj).includes(value) ? value : null;
  }

  private validateEnumArray<T extends string>(
    values: T[] | null | undefined,
    enumObj: Record<string, T>,
    defaultValue: T[]
  ): T[] {
    if (!values || !Array.isArray(values)) return defaultValue;
    const valid = values.filter((v) => Object.values(enumObj).includes(v));
    return valid.length > 0 ? valid : defaultValue;
  }



}
