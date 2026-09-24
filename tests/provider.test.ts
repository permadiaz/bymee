import { test } from "node:test";
import assert from "node:assert/strict";
import { providerError, AIError } from "../lib/ai/errors";
import { provider } from "../lib/ai/provider";
test("provider errors distinguish key, model, quota and upstream outages without leaking details", async () => {
  for (const [status, detail, code] of [
    [400, "API key not valid: SECRET_KEY", "AI_KEY_INVALID"],
    [401, "SECRET_KEY", "AI_KEY_INVALID"],
    [403, "private customer text", "AI_ACCESS_DENIED"],
    [404, "model not found", "AI_MODEL_NOT_FOUND"],
    [429, "quota exceeded", "AI_PROVIDER_QUOTA"],
    [400, "unsupported response_format", "AI_REQUEST_REJECTED"],
    [503, "private upstream URL", "AI_PROVIDER_UNAVAILABLE"],
  ] as const) {
    const error = await providerError(
      new Response(JSON.stringify({ error: { message: detail } }), { status }),
    );
    assert.equal(error.code, code);
    assert.ok(!error.message.includes(detail));
  }
});
test("live adapter normalizes configuration and reports failures safely", async () => {
  const previous = {
    DEMO_MODE: process.env.DEMO_MODE,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
  };
  const originalFetch = globalThis.fetch;
  try {
    process.env.DEMO_MODE = "false";
    process.env.AI_API_KEY = " test-key ";
    process.env.AI_MODEL = " test-model ";
    process.env.AI_BASE_URL = " https://example.com/v1/ ";
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://example.com/v1/chat/completions");
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer test-key",
      );
      assert.equal(JSON.parse(String(init?.body)).model, "test-model");
      return new Response("{}", { status: 429 });
    };
    await assert.rejects(
      () => provider.analyze({ mode: "research", fields: { Company: "Test" } }),
      (e: unknown) => e instanceof AIError && e.code === "AI_PROVIDER_QUOTA",
    );
    globalThis.fetch = async () =>
      new Response('{"choices":[{"message":{"content":"not json"}}]}');
    await assert.rejects(
      () => provider.analyze({ mode: "research", fields: { Company: "Test" } }),
      (e: unknown) => e instanceof AIError && e.code === "AI_INVALID_OUTPUT",
    );
    globalThis.fetch = async () => {
      throw new DOMException("timed out", "TimeoutError");
    };
    await assert.rejects(
      () => provider.analyze({ mode: "research", fields: { Company: "Test" } }),
      (e: unknown) => e instanceof AIError && e.code === "AI_TIMEOUT",
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
