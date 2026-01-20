export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }>> {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results: Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }> = [];

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(batch.map(processor));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push({ status: "fulfilled", value: result.value });
      } else {
        results.push({ status: "rejected", reason: result.reason });
      }
    }
  }

  return results;
}
