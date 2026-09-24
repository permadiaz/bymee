import { z } from "zod";
import { resultSchema, type RunInput } from "./types";
import { AIError } from "./errors";

export function isDirectGemini(baseUrl: string) {
  const url = new URL(baseUrl);
  return (
    url.protocol === "https:" &&
    url.hostname === "generativelanguage.googleapis.com"
  );
}

export function geminiRequest(
  model: string,
  apiKey: string,
  prompt: string,
  input: RunInput,
) {
  // JSON Schema is generated from the same contract used to validate outputs.
  const schema = z.toJSONSchema(resultSchema);
  delete schema.$schema;
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.replace(/^models\//, ""))}:generateContent`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      }),
    } satisfies RequestInit,
  };
}

export function geminiText(body: unknown): string {
  const parsed = z
    .object({
      promptFeedback: z
        .object({ blockReason: z.string().optional() })
        .optional(),
      candidates: z
        .array(
          z.object({
            finishReason: z.string().optional(),
            content: z
              .object({
                parts: z.array(
                  z.object({
                    text: z.string().optional(),
                    thought: z.boolean().optional(),
                  }),
                ),
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .parse(body);
  const candidate = parsed.candidates?.[0];
  if (
    parsed.promptFeedback?.blockReason ||
    ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "RECITATION"].includes(
      candidate?.finishReason || "",
    )
  )
    throw new AIError(
      "Gemini tidak menghasilkan jawaban karena pembatasan konten. Periksa konteks yang dikirim.",
      "AI_CONTENT_BLOCKED",
    );
  if (candidate?.finishReason === "MAX_TOKENS")
    throw new AIError(
      "Jawaban Gemini terpotong karena batas output. Coba persempit cakupan analisis.",
      "AI_OUTPUT_TRUNCATED",
    );
  const text = candidate?.content?.parts
    .filter((part) => !part.thought)
    .map((part) => part.text || "")
    .join("");
  if (!text)
    throw new AIError(
      "Gemini mengembalikan respons kosong. Coba lagi nanti.",
      "AI_EMPTY_OUTPUT",
    );
  return text;
}
