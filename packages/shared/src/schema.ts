import { z } from "zod";
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

export const VolumeSchema = z.object({
  quantity: z.number().nullable(),
  unit: z.nativeEnum(VolumeUnit).nullable(),
  isPeak: z.boolean(),
});

export const ExtractionSchema = z.object({
  industry: z.nativeEnum(Industry).nullable(),
  businessModel: z.nativeEnum(BusinessModel).nullable(),
  jtbdPrimary: z.array(z.nativeEnum(JtbdPrimary)),
  painPoints: z.array(z.nativeEnum(PainPoints)),
  leadSource: z.nativeEnum(LeadSource).nullable(),
  processMaturity: z.nativeEnum(ProcessMaturity).nullable(),
  toolingMaturity: z.nativeEnum(ToolingMaturity).nullable(),
  knowledgeComplexity: z.nativeEnum(KnowledgeComplexity).nullable(),
  riskLevel: z.nativeEnum(RiskLevel).nullable(),
  integrations: z.array(z.nativeEnum(Integrations)),
  urgency: z.nativeEnum(Urgency).nullable(),
  successMetrics: z.array(z.nativeEnum(SuccessMetric)),
  objections: z.array(z.nativeEnum(Objections)),
  sentiment: z.nativeEnum(Sentiment).nullable(),
  volume: VolumeSchema.nullable(),
  confidence: z.number().min(0).max(1),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  seller: z.string(),
  meetingDate: z.string(),
  closed: z.boolean(),
  createdAt: z.string(),
});

export const MeetingSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  transcript: z.string(),
  createdAt: z.string(),
});

export const CustomerFilterSchema = z.object({
  seller: z.string().optional(),
  closed: z.boolean().optional(),
  leadSource: z.nativeEnum(LeadSource).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  painPoints: z.array(z.nativeEnum(PainPoints)).optional(),
  industry: z.nativeEnum(Industry).optional(),
});

export const MetricsOverviewSchema = z.object({
  totalCustomers: z.number(),
  closedDeals: z.number(),
  conversionRate: z.number(),
  avgVolume: z.number().nullable(),
  topLeadSources: z.array(
    z.object({
      source: z.nativeEnum(LeadSource),
      count: z.number(),
    })
  ),
  topPainPoints: z.array(
    z.object({
      painPoint: z.nativeEnum(PainPoints),
      count: z.number(),
    })
  ),
  bySeller: z.array(
    z.object({
      seller: z.string(),
      total: z.number(),
      closed: z.number(),
      conversionRate: z.number(),
    })
  ),
});
