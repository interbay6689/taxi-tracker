
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
      await sleep(delayMs);
    }
  }
  throw lastError;
}
