import { test } from "node:test";
import assert from "node:assert/strict";
import { demoAnalysis } from "../lib/ai/demo";
import { modes, resultSchema, inputSchema } from "../lib/ai/types";
test("all demo workflows produce structured Indonesian output and explicit demo labels", () => {
  for (const mode of modes) {
    const result = resultSchema.parse(
      demoAnalysis({
        mode,
        fields: {
          Company: "Test Account",
          Contact: "Andi",
          "Raw notes": "Kontrak berakhir Desember.",
        },
      }),
    );
    assert.equal(result.demo, true);
    assert.equal(result.company, "Test Account");
    assert.ok(result.sections.length >= 4);
    assert.deepEqual(result.contacts, ["Andi"]);
    for (const section of result.sections.filter((s) => s.label === "FACT"))
      assert.equal(section.source, "User input — unverified");
  }
});
test("canvassing brief includes five starters and five discovery questions", () => {
  const result = demoAnalysis({
    mode: "canvassing",
    fields: { Company: "Test" },
  });
  assert.equal(
    result.sections.find((s) => s.title === "Conversation starters")?.items
      .length,
    5,
  );
  assert.equal(
    result.sections.find((s) => s.title === "Discovery questions")?.items
      .length,
    5,
  );
  assert.ok(
    result.sections.find((s) => s.title === "Likely pain points")!.items
      .length >= 3,
  );
});
test("reject empty, unknown mode and oversized field input", () => {
  assert.equal(
    inputSchema.safeParse({ mode: "inbox", fields: { Context: " " } }).success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({ mode: "fake", fields: { Context: "hello" } })
      .success,
    false,
  );
  assert.equal(
    inputSchema.safeParse({
      mode: "inbox",
      fields: { Context: "a".repeat(12001) },
    }).success,
    false,
  );
});
test("research does not pretend to have performed current web research", () => {
  const result = demoAnalysis({
    mode: "research",
    fields: { Company: "Test" },
  });
  assert.match(
    result.sections.find((s) => s.title === "Recent information")!.items[0],
    /Data tidak tersedia secara publik/,
  );
});
