import { ProgressData } from "@/hooks/useExtractionProgress";

export function buildCompletionMessage(progressData: ProgressData): string {
  const messageParts = [];

  if (progressData.pending > 0) {
    messageParts.push(`${progressData.pending} pendientes`);
  }

  if (progressData.retried > 0) {
    messageParts.push(`${progressData.retried} reintentos`);
  }

  const statusMessage = messageParts.length > 0 ? ` (${messageParts.join(", ")})` : "";
  let toastMessage = `Análisis completado: ${progressData.success} exitosos`;

  if (progressData.failed > 0) {
    toastMessage += `, ${progressData.failed} fallidos`;
    if (progressData.failed === progressData.total - progressData.success) {
      toastMessage += " (posible falta de cuota en la API)";
    }
  }

  toastMessage += statusMessage;
  return toastMessage;
}

export function buildUploadCompletionMessage(
  progressData: ProgressData,
  duplicates: number
): string {
  const messageParts = [];

  if (progressData.pending > 0) {
    messageParts.push(`${progressData.pending} pendientes`);
  }

  if (progressData.retried > 0) {
    messageParts.push(`${progressData.retried} reintentos`);
  }

  const statusMessage = messageParts.length > 0 ? ` (${messageParts.join(", ")})` : "";
  const duplicatesMessage = duplicates > 0 ? `, ${duplicates} duplicados` : "";

  return `Análisis completado: ${progressData.success} exitosos, ${progressData.failed} fallidos${duplicatesMessage}${statusMessage}`;
}
