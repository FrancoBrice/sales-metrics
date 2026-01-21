import { PROCESSING_TIMEOUT_MS } from "../constants";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }>> {
  if (items.length === 0) {
    return [];
  }

  const chunks = chunkArray(items, concurrency);
  const results: Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }> = [];

  for (const chunk of chunks) {
    const chunkPromises = chunk.map((item) => {
      return Promise.race([
        processor(item).then((value) => ({ status: "fulfilled" as const, value })),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Request timeout after ${PROCESSING_TIMEOUT_MS / 1000} seconds`)), PROCESSING_TIMEOUT_MS)
        ),
      ]).catch((error) => ({ status: "rejected" as const, reason: error }));
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}
