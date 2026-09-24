import { demoAnalysis } from "./ai/demo";
import type { SavedItem, Action, RunInput } from "./ai/types";
const inputs: RunInput[] = [
  {
    mode: "debrief",
    fields: {
      Company: "Nusantara Logistik",
      Contact: "Andi · Procurement",
      "Raw notes":
        "Ketemu Pak Andi. IT dipegang pusat. Kontrak cloud sampai Desember. Perlu dikenalkan ke Pak Budi di IT.",
    },
  },
  {
    mode: "research",
    fields: {
      Company: "Karya Retail",
      Context:
        "Contoh akun: jaringan retail yang sedang mengevaluasi operasional cabang.",
      Contact: "Maya · Operations",
    },
  },
  {
    mode: "opportunity",
    fields: {
      Company: "Sagara Teknologi",
      Opportunity: "Evaluasi cloud infrastructure",
      Contact: "Rizky · IT Manager",
      "Known pain point": "Visibilitas biaya cloud",
      Timeline: "Evaluasi kuartal berikutnya",
    },
  },
];
export function seedItems(): SavedItem[] {
  return inputs.map((input, i) => ({
    id: `demo-${i}`,
    mode: input.mode,
    input,
    result: demoAnalysis(input),
    pinned: i === 0,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}
export function seedActions(): Action[] {
  return [
    {
      id: "action-1",
      title: "Ask Andi for an introduction to the IT team",
      company: "Nusantara Logistik",
      done: false,
      due: new Date().toISOString().slice(0, 10),
    },
    {
      id: "action-2",
      title: "Confirm priorities for the branch operations discussion",
      company: "Karya Retail",
      done: false,
      due: new Date().toISOString().slice(0, 10),
    },
  ];
}
