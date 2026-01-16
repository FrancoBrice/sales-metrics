import { describe, it, expect } from "vitest";
import { detectLeadSource } from "./leadSourceDetector";
import { LeadSource } from "@vambe/shared";

describe("leadSourceDetector", () => {
  it("detects LinkedIn as lead source", () => {
    const transcript = "Conocí Vambe gracias a una publicación en LinkedIn";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.LINKEDIN);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("detects Google search as lead source", () => {
    const transcript = "Buscando soluciones en Google encontré Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.GOOGLE);
  });

  it("detects conference as lead source", () => {
    const transcript = "En una conferencia de tecnología escuché sobre Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.CONFERENCIA);
  });

  it("detects recommendation from colleague", () => {
    const transcript = "Un colega en la industria recomendó Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.RECOMENDACION);
  });

  it("detects recommendation from friend", () => {
    const transcript = "Un amigo me habló de Vambe como solución";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.RECOMENDACION);
  });

  it("detects webinar as lead source", () => {
    const transcript = "Asistí a un webinar donde presentaron Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.WEBINAR);
  });

  it("detects podcast as lead source", () => {
    const transcript = "Escuché sobre Vambe en un podcast de tecnología";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.PODCAST);
  });

  it("detects trade fair as lead source", () => {
    const transcript = "Conocimos Vambe en una feria empresarial";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.FERIA);
  });

  it("detects article as lead source", () => {
    const transcript = "Leímos sobre Vambe en un artículo de tecnología";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.ARTICULO);
  });

  it("returns unknown for unclear transcript", () => {
    const transcript = "Queremos mejorar nuestra atención al cliente";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.DESCONOCIDO);
  });

  it("handles text with typos", () => {
    const transcript = "Un compañero de trabajo mencionó Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.RECOMENDACION);
  });

  it("handles text with accents and normalization", () => {
    const transcript = "En una conferéncia de tecnología mencionaron Vambe";
    const result = detectLeadSource(transcript);
    expect(result.source).toBe(LeadSource.CONFERENCIA);
  });
});
