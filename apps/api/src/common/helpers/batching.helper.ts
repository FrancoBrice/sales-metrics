export async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
  delayBetweenBatches = 0
): Promise<Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }>> {
  const results: Array<{ status: "fulfilled" | "rejected"; value?: R; reason?: unknown }> = [];
  const executing: Promise<void>[] = [];
  let index = 0;

  const executeItem = async (item: T, itemIndex: number): Promise<void> => {
    try {
      const result = await Promise.race([
        processor(item),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Request timeout after 90 seconds for item ${itemIndex}`)), 90000)
        ),
      ]);
      results[itemIndex] = { status: "fulfilled", value: result };
    } catch (error) {
      results[itemIndex] = { status: "rejected", reason: error };
    }
  };

  while (index < items.length || executing.length > 0) {
    while (executing.length < concurrency && index < items.length) {
      const currentIndex = index++;
      const promise = executeItem(items[currentIndex], currentIndex).then(() => {
        const promiseIndex = executing.indexOf(promise);
        if (promiseIndex > -1) {
          executing.splice(promiseIndex, 1);
        }
      });
      executing.push(promise);
    }

    if (executing.length > 0) {
      await Promise.race(executing);
    }

    if (delayBetweenBatches > 0 && index < items.length && executing.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
