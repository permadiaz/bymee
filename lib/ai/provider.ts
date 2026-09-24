import { demoAnalysis } from "./demo";
import { sections, systemPrompt } from "./prompts";
import { resultSchema, type RunInput, type Mode } from "./types";
export interface AIProvider {
  analyze(input: RunInput): Promise<ReturnType<typeof resultSchema.parse>>;
}
export const provider: AIProvider = {
  async analyze(input) {
    if (process.env.DEMO_MODE !== "false") return demoAnalysis(input);
    if (!process.env.AI_API_KEY || !process.env.AI_MODEL)
      throw new Error(
        "AI provider is not configured. Enable DEMO_MODE or configure a provider.",
      );
    const response = await fetch(
      `${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
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
      },
    );
    if (!response.ok)
      throw new Error(
        "AI provider could not complete the request. Please try again.",
      );
    const body = await response.json();
    const parsed = resultSchema.parse(
      JSON.parse(body.choices[0].message.content),
    );
    return { ...parsed, demo: false };
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
