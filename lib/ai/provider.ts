import { demoAnalysis } from "./demo";
import { sections, systemPrompt } from "./prompts";
import { resultSchema, type RunInput, type Mode } from "./types";
import { AIError, providerError } from "./errors";
export interface AIProvider {
  analyze(input: RunInput): Promise<ReturnType<typeof resultSchema.parse>>;
}
export const provider: AIProvider = {
  async analyze(input) {
    if (process.env.DEMO_MODE !== "false") return demoAnalysis(input);
    const apiKey = process.env.AI_API_KEY?.trim();
    const model = process.env.AI_MODEL?.trim();
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1")
      .trim()
      .replace(/\/+$/, "");
    if (!apiKey || !model)
      throw new AIError(
        "AI_API_KEY atau AI_MODEL belum diisi. Lengkapi environment variables Production di Vercel, lalu redeploy.",
        "AI_NOT_CONFIGURED",
        503,
      );
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                systemPrompt +
                ` Required sections: ${sections[input.mode].join(", ")}`,
            },
            { role: "user", content: JSON.stringify(input) },
          ],
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45000),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        ["TimeoutError", "AbortError"].includes(error.name)
      )
        throw new AIError(
          "Provider AI tidak merespons dalam 45 detik. Coba lagi dengan konteks lebih singkat.",
          "AI_TIMEOUT",
          504,
        );
      throw new AIError(
        "Tidak dapat menghubungi provider AI. Periksa AI_BASE_URL dan koneksi provider.",
        "AI_CONNECTION_FAILED",
      );
    }
    if (!response.ok) throw await providerError(response);
    try {
      const body = await response.json();
      const parsed = resultSchema.parse(
        JSON.parse(body.choices[0].message.content),
      );
      return { ...parsed, demo: false };
    } catch {
      throw new AIError(
        "Respons AI tidak sesuai struktur BYMEE. Coba lagi; jika berulang, gunakan model yang mendukung JSON output.",
        "AI_INVALID_OUTPUT",
      );
    }
  },
};
const run = (mode: Mode, fields: Record<string, string>) =>
  provider.analyze({ mode, fields });
export const analyzeInbox = (f: Record<string, string>) => run("inbox", f);
export const prepareCanvassing = (f: Record<string, string>) =>
  run("canvassing", f);
export const prepareMeeting = (f: Record<string, string>) => run("meeting", f);
export const analyzeOpportunity = (f: Record<string, string>) =>
  run("opportunity", f);
export const createDebrief = (f: Record<string, string>) => run("debrief", f);
export const generateResponse = (f: Record<string, string>) =>
  run("response", f);
export const runIntel = (f: Record<string, string>) => run("intel", f);
