import { test } from "node:test";
import assert from "node:assert/strict";
import { requestAI } from "../lib/ai/request";

test("transient provider failure retries once with the same body and deadline", async () => {
  let calls = 0,
    waits = 0;
  const signal = AbortSignal.timeout(45000);
  const result = await requestAI(
    "https://example.com",
    { method: "POST", body: "request", signal },
    {
      fetch: async (_url, init) => {
        calls++;
        assert.equal(init?.signal, signal);
        assert.equal(init?.body, "request");
        return new Response("{}", { status: calls === 1 ? 503 : 200 });
      },
      pause: async () => {
        waits++;
      },
    },
  );
  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.equal(waits, 1);
});

test("persistent outage is capped at two attempts", async () => {
  let calls = 0;
  const result = await requestAI(
    "https://example.com",
    {},
    {
      fetch: async () => {
        calls++;
        return new Response("{}", { status: 502 });
      },
      pause: async () => {},
    },
  );
  assert.equal(result.status, 502);
  assert.equal(calls, 2);
});

test("quota and configuration failures are not retried", async () => {
  for (const status of [400, 401, 403, 404, 429]) {
    let calls = 0;
    const result = await requestAI(
      "https://example.com",
      {},
      {
        fetch: async () => {
          calls++;
          return new Response("{}", { status });
        },
        pause: async () => {
          assert.fail("must not retry");
        },
      },
    );
    assert.equal(result.status, status);
    assert.equal(calls, 1);
  }
});

test("expired deadline prevents the second request", async () => {
  let calls = 0;
  const controller = new AbortController();
  await assert.rejects(
    () =>
      requestAI(
        "https://example.com",
        { signal: controller.signal },
        {
          fetch: async () => {
            calls++;
            return new Response("{}", { status: 503 });
          },
          pause: async () => {
            controller.abort();
          },
        },
      ),
    { name: "AbortError" },
  );
  assert.equal(calls, 1);
});
