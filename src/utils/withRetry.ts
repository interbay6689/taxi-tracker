
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Runs an async function with retries.
 * - Exponential backoff with jitter for stability under flaky networks.
 * - Default: 2 retries (total 3 attempts), base delay 600ms.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 600
): Promise<T> {
  let attempt = 0;
  let lastError: any;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      attempt++;

      if (attempt > retries) break;

      // Exponential backoff with jitter
      const expo = Math.max(1, attempt); // 1, 2, 3, ...
      const base = delayMs * Math.pow(2, expo - 1); // 600, 1200, 2400...
      const jitter = Math.floor(Math.random() * 250); // 0-250ms
      const waitFor = base + jitter;

      // If offline, wait a bit longer to give time for reconnection
      const isOffline = typeof navigator !== 'undefined' && navigator && 'onLine' in navigator ? !navigator.onLine : false;
      const offlinePenalty = isOffline ? 500 : 0;

      await sleep(waitFor + offlinePenalty);
    }
  }
  throw lastError;
}
