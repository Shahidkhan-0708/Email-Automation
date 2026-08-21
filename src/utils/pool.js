// ---------------------------------------------------------------------------
// Bounded concurrency pool — runs `fn(item, index)` over `items` with at most
// `limit` promises in flight at once, preserving result order.
// ---------------------------------------------------------------------------
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let settled = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
      settled++;
    }
  };

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
