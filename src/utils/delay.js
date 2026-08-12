export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function rateLimitedMap(items, fn, delayMs = 1000) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const result = await fn(items[i], i);
    results.push(result);
    if (i < items.length - 1 && delayMs > 0) {
      await delay(delayMs);
    }
  }
  return results;
}
