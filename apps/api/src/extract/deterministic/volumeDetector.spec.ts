import { describe, it, expect } from "vitest";
import { detectVolume } from "./volumeDetector";
import { VolumeUnit } from "@vambe/shared";

describe("volumeDetector", () => {
  it("detects daily interactions", () => {
    const transcript = "Actualmente manejamos alrededor de 100 interacciones diarias";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.quantity).toBe(100);
    expect(result.volume?.unit).toBe(VolumeUnit.DIARIO);
    expect(result.volume?.isPeak).toBe(false);
  });

  it("detects weekly interactions", () => {
    const transcript = "Normalmente gestionamos unas 200 consultas semanales";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.quantity).toBe(200);
    expect(result.volume?.unit).toBe(VolumeUnit.SEMANAL);
  });

  it("detects messages with 'más de' prefix", () => {
    const transcript = "Durante picos podemos llegar a más de 300 mensajes al día";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.quantity).toBe(300);
    expect(result.volume?.unit).toBe(VolumeUnit.DIARIO);
  });

  it("detects peak volumes", () => {
    const transcript = "En temporada alta puede superar los 500 mensajes";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.isPeak).toBe(true);
  });

  it("detects volumes during promotions", () => {
    const transcript = "Durante las promociones podemos recibir hasta 250 consultas diarias";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.isPeak).toBe(true);
  });

  it("detects 'cerca de' volumes", () => {
    const transcript = "Manejamos cerca de 150 interacciones semanales";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.quantity).toBe(150);
  });

  it("returns null for transcripts without volume info", () => {
    const transcript = "Queremos mejorar nuestra atención al cliente";
    const result = detectVolume(transcript);
    expect(result.volume).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("handles various number formats", () => {
    const transcript = "El volumen ya supera los 250 mensajes diarios";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.quantity).toBe(250);
  });

  it("detects interactions per week", () => {
    const transcript = "Recibimos 500 interacciones a la semana";
    const result = detectVolume(transcript);
    expect(result.volume).not.toBeNull();
    expect(result.volume?.unit).toBe(VolumeUnit.SEMANAL);
    expect(result.volume?.quantity).toBe(500);
  });
});
