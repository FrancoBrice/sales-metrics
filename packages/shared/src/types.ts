import { z } from "zod";
import {
  ExtractionSchema,
  CustomerSchema,
  MeetingSchema,
  CustomerFilterSchema,
  MetricsOverviewSchema,
  VolumeSchema,
} from "./schema";

export type Extraction = z.infer<typeof ExtractionSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type CustomerFilter = z.infer<typeof CustomerFilterSchema>;
export type MetricsOverview = z.infer<typeof MetricsOverviewSchema>;
export type Volume = z.infer<typeof VolumeSchema>;

export interface CustomerWithExtraction extends Customer {
  extraction?: Extraction | null;
  meeting?: Meeting | null;
}

export interface CsvRow {
  Nombre: string;
  "Correo Electronico": string;
  "Numero de Telefono": string;
  "Fecha de la Reunion": string;
  "Vendedor asignado": string;
  closed: string;
  Transcripcion: string;
}

export interface DeterministicExtractionResult {
  leadSource: string | null;
  volume: Volume | null;
  integrations: string[];
  confidence: {
    leadSource: number;
    volume: number;
    integrations: number;
  };
}

export interface MetricsByDimension {
  dimension: string;
  values: Array<{
    value: string;
    count: number;
    closedCount: number;
    conversionRate: number;
  }>;
}
