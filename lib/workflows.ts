import type { Mode } from "./ai/types";
export const workflows: Record<
  Mode,
  { title: string; description: string; fields: string[] }
> = {
  inbox: {
    title: "Universal Inbox",
    description: "Turn the incoming noise into a clear next step.",
    fields: ["Context", "Company"],
  },
  research: {
    title: "Quick Research",
    description: "Know the account before the first conversation.",
    fields: ["Company", "Context"],
  },
  canvassing: {
    title: "Canvassing Prep",
    description: "Walk in with context. Walk out with a next step.",
    fields: [
      "Company",
      "Visit objective",
      "Target PIC",
      "Product / solution",
      "Known information",
      "Notes",
    ],
  },
  meeting: {
    title: "Meeting Prep",
    description: "Make every conversation move things forward.",
    fields: [
      "Company",
      "Contact",
      "Meeting objective",
      "Previous interaction",
      "Known opportunity",
      "Notes",
    ],
  },
  opportunity: {
    title: "Opportunity Analysis",
    description: "See the signals, the gaps, and the way forward.",
    fields: [
      "Company",
      "Opportunity",
      "Known pain point",
      "Estimated budget",
      "Decision maker",
      "Competitors",
      "Timeline",
      "Notes",
    ],
  },
  intel: {
    title: "Deep Intel",
    description: "Separate what is known from what needs to be proven.",
    fields: ["Topic", "Company", "Context"],
  },
  response: {
    title: "Before I Respond",
    description: "A little perspective before you hit send.",
    fields: ["Message", "Company", "Context"],
  },
  debrief: {
    title: "Debrief",
    description: "Capture the conversation while it is still fresh.",
    fields: ["Company", "Contact", "Interaction type", "Raw notes"],
  },
};
