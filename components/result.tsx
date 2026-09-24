"use client";
import { Bookmark, Copy, ArrowUpRight, Check } from "lucide-react";
import type { SavedItem } from "@/lib/ai/types";
export default function Result({
  item,
  saved,
  onSave,
  onFollow,
  onCompany,
  onCopy,
}: {
  item: SavedItem;
  saved: boolean;
  onSave: () => void;
  onFollow: () => void;
  onCompany: (name: string) => void;
  onCopy: (text: string) => void;
}) {
  const r = item.result;
  return (
    <article className="result panel">
      <div className="eyebrow">
        {r.demo
          ? "DEMO OUTPUT · NOT VERIFIED RESEARCH"
          : "AI ANALYSIS · REVIEW BEFORE USE"}
      </div>
      <div className="section-heading">
        <h2>{r.title}</h2>
        {r.company && (
          <button className="chip" onClick={() => onCompany(r.company)}>
            {r.company}
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
      <p>{r.summary}</p>
      <div className="next-step">
        <span className="eyebrow">YOUR NEXT MOVE</span>
        <p>{r.nextAction}</p>
      </div>
      <div className="result-grid">
        {r.sections.map((section, i) => (
          <section key={i}>
            <div className="section-heading">
              <h3>{section.title}</h3>
              <span className={`evidence ${section.label.toLowerCase()}`}>
                {section.label}
              </span>
            </div>
            <ul>
              {section.items.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ul>
            {section.source && <small>Source: {section.source}</small>}
          </section>
        ))}
      </div>
      {r.draft && (
        <section className="draft">
          <h3>Draft response</h3>
          <p>{r.draft}</p>
          <button className="text-button" onClick={() => onCopy(r.draft!)}>
            <Copy size={16} />
            Copy Response
          </button>
        </section>
      )}
      <div className="button-row">
        <button className="primary" disabled={saved} onClick={onSave}>
          {saved ? <Check size={16} /> : <Bookmark size={16} />}{" "}
          {saved ? "Saved to Brain" : "Save to Brain"}
        </button>
        <button className="secondary" onClick={onFollow}>
          Create Follow-up <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}
