import { setTimeout as delay } from "node:timers/promises";

const transientStatuses = new Set([500, 502, 503, 504]);

// Retry only explicit transient failures, never rejected credentials, quota,
// invalid requests, or ambiguous network failures. Both attempts share a deadline.
export async function requestAI(
  url: string,
  init: RequestInit,
  dependencies: {
    fetch: typeof fetch;
    pause: (signal: AbortSignal) => Promise<void>;
  } = {
    fetch: globalThis.fetch,
    pause: async (signal) => {
      await delay(1000, undefined, { signal });
    },
  },
): Promise<Response> {
  const signal = init.signal ?? AbortSignal.timeout(45000);
  const options = { ...init, signal };
  signal.throwIfAborted();
  const response = await dependencies.fetch(url, options);
  if (!transientStatuses.has(response.status)) return response;
  await response.body?.cancel();
  await dependencies.pause(signal);
  signal.throwIfAborted();
  return dependencies.fetch(url, options);
}
