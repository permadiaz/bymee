import { test } from "node:test";
import assert from "node:assert/strict";
import { geminiRequest, geminiText, isDirectGemini } from "../lib/ai/gemini";
import { provider } from "../lib/ai/provider";
import { demoAnalysis } from "../lib/ai/demo";
import { AIError } from "../lib/ai/errors";

test("native Gemini builds schema-constrained request without putting key in URL or prompt", () => {
  const request = geminiRequest(
    "models/gemini-3.1-flash-lite",
    "secret-test-key",
    "system",
    { mode: "research", fields: { Company: "Test" } },
  );
  assert.equal(
    request.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
  );
  assert.equal(request.init.headers["x-goog-api-key"], "secret-test-key");
  const body = JSON.parse(request.init.body);
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.ok(
    body.generationConfig.responseJsonSchema.required.includes("sections"),
  );
  assert.equal(body.contents[0].role, "user");
  assert.ok(!request.init.body.includes("secret-test-key"));
  assert.equal(
    isDirectGemini("https://generativelanguage.googleapis.com/v1beta/openai"),
    true,
  );
  assert.equal(isDirectGemini("https://openrouter.ai/api/v1"), false);
  assert.equal(
    isDirectGemini("https://generativelanguage.googleapis.com.example.com"),
    false,
  );
});

test("Gemini parser excludes thoughts and distinguishes blocked, empty, and truncated responses", () => {
  assert.equal(
    geminiText({
      candidates: [
        {
          content: {
            parts: [
              { text: "private reasoning", thought: true },
              { text: '{"ok":' },
              { text: "true}" },
            ],
          },
          finishReason: "STOP",
        },
      ],
    }),
    '{"ok":true}',
  );
  for (const [body, code] of [
    [{ promptFeedback: { blockReason: "SAFETY" } }, "AI_CONTENT_BLOCKED"],
    [{ candidates: [{ finishReason: "MAX_TOKENS" }] }, "AI_OUTPUT_TRUNCATED"],
    [{ candidates: [] }, "AI_EMPTY_OUTPUT"],
  ] as const)
    assert.throws(
      () => geminiText(body),
      (e: unknown) => e instanceof AIError && e.code === code,
    );
});

test("existing Gemini environment uses native adapter and parses research output end to end", async () => {
  const keys = ["DEMO_MODE", "AI_API_KEY", "AI_MODEL", "AI_BASE_URL"] as const;
  const previous = keys.map((k) => [k, process.env[k]] as const);
  const originalFetch = globalThis.fetch;
  try {
    process.env.DEMO_MODE = "false";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "gemini-3.1-flash-lite";
    process.env.AI_BASE_URL =
      "https://generativelanguage.googleapis.com/v1beta/openai";
    const input = {
      mode: "research" as const,
      fields: { Company: "Akademi Maritim Nasional Jakarta Raya" },
    };
    const output = { ...demoAnalysis(input), demo: false };
    globalThis.fetch = async (url, init) => {
      assert.match(String(url), /:generateContent$/);
      assert.ok(!String(url).includes("chat/completions"));
      assert.equal(
        (init?.headers as Record<string, string>)["x-goog-api-key"],
        "test-key",
      );
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: JSON.stringify(output) }] },
              finishReason: "STOP",
            },
          ],
        }),
      );
    };
    assert.deepEqual(await provider.analyze(input), output);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: "model not found" } }), {
        status: 404,
      });
    await assert.rejects(
      () => provider.analyze(input),
      (e: unknown) =>
        e instanceof AIError && e.message.includes("[Gemini native HTTP 404]"),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
