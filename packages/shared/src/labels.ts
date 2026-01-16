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
} from "./enums";

export const IndustryLabels: Record<Industry, string> = {
  [Industry.SERVICIOS_FINANCIEROS]: "Servicios Financieros",
  [Industry.RETAIL]: "Retail",
  [Industry.ECOMMERCE]: "E-Commerce",
  [Industry.SALUD]: "Salud",
  [Industry.EDUCACION]: "Educación",
  [Industry.TECNOLOGIA]: "Tecnología",
  [Industry.LOGISTICA]: "Logística",
  [Industry.TURISMO]: "Turismo",
  [Industry.HOSPITALIDAD]: "Hospitalidad",
  [Industry.CONSULTORIA]: "Consultoría",
  [Industry.LEGAL]: "Legal",
  [Industry.INMOBILIARIA]: "Inmobiliaria",
  [Industry.ALIMENTOS]: "Alimentos",
  [Industry.MODA]: "Moda",
  [Industry.EVENTOS]: "Eventos",
  [Industry.MARKETING]: "Marketing",
  [Industry.ARQUITECTURA]: "Arquitectura",
  [Industry.CONSTRUCCION]: "Construcción",
  [Industry.ENERGIA]: "Energía",
  [Industry.AGRICULTURA]: "Agricultura",
  [Industry.ONG]: "ONG",
  [Industry.OTRO]: "Otro",
};

export const BusinessModelLabels: Record<BusinessModel, string> = {
  [BusinessModel.B2B]: "B2B",
  [BusinessModel.B2C]: "B2C",
  [BusinessModel.B2B2C]: "B2B2C",
  [BusinessModel.MARKETPLACE]: "Marketplace",
};

export const JtbdPrimaryLabels: Record<JtbdPrimary, string> = {
  [JtbdPrimary.AUTOMATIZAR_ATENCION]: "Automatizar Atención",
  [JtbdPrimary.REDUCIR_TIEMPOS]: "Reducir Tiempos",
  [JtbdPrimary.ESCALAR_OPERACIONES]: "Escalar Operaciones",
  [JtbdPrimary.MEJORAR_EXPERIENCIA]: "Mejorar Experiencia",
  [JtbdPrimary.LIBERAR_EQUIPO]: "Liberar Equipo",
  [JtbdPrimary.MULTIIDIOMA]: "Soporte Multiidioma",
  [JtbdPrimary.DISPONIBILIDAD_24_7]: "Disponibilidad 24/7",
};

export const PainPointsLabels: Record<PainPoints, string> = {
  [PainPoints.VOLUMEN_ALTO]: "Alto Volumen",
  [PainPoints.RESPUESTAS_LENTAS]: "Respuestas Lentas",
  [PainPoints.FALTA_PERSONALIZACION]: "Falta de Personalización",
  [PainPoints.SOBRECARGA_EQUIPO]: "Sobrecarga del Equipo",
  [PainPoints.CONSULTAS_REPETITIVAS]: "Consultas Repetitivas",
  [PainPoints.GESTION_MANUAL]: "Gestión Manual",
  [PainPoints.PICOS_DEMANDA]: "Picos de Demanda",
  [PainPoints.MULTICANAL]: "Gestión Multicanal",
};

export const LeadSourceLabels: Record<LeadSource, string> = {
  [LeadSource.LINKEDIN]: "LinkedIn",
  [LeadSource.GOOGLE]: "Google",
  [LeadSource.CONFERENCIA]: "Conferencia",
  [LeadSource.RECOMENDACION]: "Recomendación",
  [LeadSource.WEBINAR]: "Webinar",
  [LeadSource.PODCAST]: "Podcast",
  [LeadSource.FERIA]: "Feria",
  [LeadSource.ARTICULO]: "Artículo",
  [LeadSource.NETWORKING]: "Networking",
  [LeadSource.REDES_SOCIALES]: "Redes Sociales",
  [LeadSource.DESCONOCIDO]: "Desconocido",
};

export const ProcessMaturityLabels: Record<ProcessMaturity, string> = {
  [ProcessMaturity.MANUAL]: "Manual",
  [ProcessMaturity.PARCIALMENTE_AUTOMATIZADO]: "Parcialmente Automatizado",
  [ProcessMaturity.AUTOMATIZADO]: "Automatizado",
};

export const ToolingMaturityLabels: Record<ToolingMaturity, string> = {
  [ToolingMaturity.SIN_HERRAMIENTAS]: "Sin Herramientas",
  [ToolingMaturity.HERRAMIENTAS_BASICAS]: "Herramientas Básicas",
  [ToolingMaturity.CRM_INTEGRADO]: "CRM Integrado",
};

export const KnowledgeComplexityLabels: Record<KnowledgeComplexity, string> = {
  [KnowledgeComplexity.SIMPLE]: "Simple",
  [KnowledgeComplexity.MODERADA]: "Moderada",
  [KnowledgeComplexity.COMPLEJA]: "Compleja",
};

export const RiskLevelLabels: Record<RiskLevel, string> = {
  [RiskLevel.BAJO]: "Bajo",
  [RiskLevel.MEDIO]: "Medio",
  [RiskLevel.ALTO]: "Alto",
};

export const IntegrationsLabels: Record<Integrations, string> = {
  [Integrations.CRM]: "CRM",
  [Integrations.SISTEMA_CITAS]: "Sistema de Citas",
  [Integrations.ECOMMERCE]: "E-Commerce",
  [Integrations.TICKETS]: "Sistema de Tickets",
  [Integrations.RESERVAS]: "Sistema de Reservas",
  [Integrations.ERP]: "ERP",
  [Integrations.WHATSAPP]: "WhatsApp",
  [Integrations.BASE_DATOS]: "Base de Datos",
};

export const UrgencyLabels: Record<Urgency, string> = {
  [Urgency.BAJA]: "Baja",
  [Urgency.MEDIA]: "Media",
  [Urgency.ALTA]: "Alta",
  [Urgency.INMEDIATA]: "Inmediata",
};

export const SuccessMetricLabels: Record<SuccessMetric, string> = {
  [SuccessMetric.TIEMPO_RESPUESTA]: "Tiempo de Respuesta",
  [SuccessMetric.VOLUMEN_PROCESADO]: "Volumen Procesado",
  [SuccessMetric.SATISFACCION_CLIENTE]: "Satisfacción del Cliente",
  [SuccessMetric.REDUCCION_CARGA]: "Reducción de Carga",
  [SuccessMetric.AHORRO_COSTOS]: "Ahorro de Costos",
};

export const ObjectionsLabels: Record<Objections, string> = {
  [Objections.COSTO]: "Costo",
  [Objections.INTEGRACION]: "Integración",
  [Objections.CONFIDENCIALIDAD]: "Confidencialidad",
  [Objections.PERSONALIZACION]: "Personalización",
  [Objections.COMPLEJIDAD]: "Complejidad",
};

export const SentimentLabels: Record<Sentiment, string> = {
  [Sentiment.POSITIVO]: "Positivo",
  [Sentiment.NEUTRAL]: "Neutral",
  [Sentiment.ESCEPTICO]: "Escéptico",
};

export const VolumeUnitLabels: Record<VolumeUnit, string> = {
  [VolumeUnit.DIARIO]: "Diario",
  [VolumeUnit.SEMANAL]: "Semanal",
  [VolumeUnit.MENSUAL]: "Mensual",
};
