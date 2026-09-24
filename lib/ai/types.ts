import { z } from "zod";
export const modes = [
  "inbox",
  "research",
  "canvassing",
  "meeting",
  "opportunity",
  "intel",
  "response",
  "debrief",
] as const;
export type Mode = (typeof modes)[number];
export const inputSchema = z
  .object({
    mode: z.enum(modes),
    fields: z.record(z.string().max(80), z.string().max(12000)),
  })
  .refine(
    (v) => Object.values(v.fields).some((s) => s.trim()),
    "Enter some context first.",
  );
export type RunInput = z.infer<typeof inputSchema>;
export const resultSchema = z.object({
  title: z.string(),
  company: z.string(),
  summary: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      label: z.enum(["FACT", "INFERENCE", "HYPOTHESIS"]),
      items: z.array(z.string()),
      source: z.string().optional(),
    }),
  ),
  nextAction: z.string(),
  draft: z.string().optional(),
  contacts: z.array(z.string()).default([]),
  demo: z.boolean(),
});
export type Analysis = z.infer<typeof resultSchema>;
export type SavedItem = {
  id: string;
  mode: Mode;
  created_at: string;
  pinned: boolean;
  input: RunInput;
  result: Analysis;
};
export type Action = {
  id: string;
  title: string;
  company: string;
  done: boolean;
  due: string;
};
