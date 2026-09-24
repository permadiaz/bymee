"use client";
import { useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { workflows } from "@/lib/workflows";
import { resultSchema, type Mode, type SavedItem } from "@/lib/ai/types";
import { supabase } from "@/lib/supabase";
export default function Workflow({
  mode,
  initial = "",
  onResult,
  savedItems = [],
}: {
  mode: Mode;
  initial?: string;
  onResult: (item: SavedItem) => void;
  savedItems?: SavedItem[];
}) {
  const config = workflows[mode];
  const [fields, setFields] = useState<Record<string, string>>({
      [config.fields[0]]: initial,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;
      const memory = savedItems
        .filter(
          (item) =>
            fields.Company &&
            item.result.company.toLowerCase() ===
              fields.Company.trim().toLowerCase(),
        )
        .slice(0, 3)
        .map((item) => `${item.created_at}: ${item.result.summary}`)
        .join("\n");
      const enrichedFields = memory
        ? { ...fields, "Saved account context": memory.slice(0, 4000) }
        : fields;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ mode, fields: enrichedFields }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not complete analysis.");
      onResult({
        id: crypto.randomUUID(),
        mode,
        input: { mode, fields },
        result: resultSchema.parse(data),
        created_at: new Date().toISOString(),
        pinned: false,
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel workflow" onSubmit={submit}>
      <div className="eyebrow">
        {mode === "intel" ? "INTEL ENGINE" : "WORKSPACE"}
      </div>
      <h2>{config.title}</h2>
      <p className="muted">{config.description}</p>
      <div className="form-grid">
        {mode === "inbox" && (
          <label className="full">
            Input type
            <select
              value={fields.Type || "Auto Detect"}
              onChange={(e) => setFields({ ...fields, Type: e.target.value })}
            >
              {[
                "Auto Detect",
                "Meeting",
                "Research",
                "Idea",
                "Problem",
                "Document",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        {config.fields.map((field, i) => {
          const long = [
            "Context",
            "Message",
            "Raw notes",
            "Notes",
            "Known information",
            "Previous interaction",
          ].includes(field);
          return (
            <label className={long ? "full" : ""} key={field}>
              {field}
              {i > 0 && <span className="optional">optional</span>}
              {field === "Interaction type" ? (
                <select
                  value={fields[field] || ""}
                  onChange={(e) =>
                    setFields({ ...fields, [field]: e.target.value })
                  }
                >
                  <option value="">Select interaction</option>
                  {[
                    "Canvassing",
                    "Meeting",
                    "Phone call",
                    "Customer conversation",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              ) : long ? (
                <textarea
                  rows={field === "Notes" ? 3 : 5}
                  required={i === 0 || field === "Raw notes"}
                  maxLength={12000}
                  placeholder={
                    field === "Raw notes"
                      ? "Ketemu Pak Andi procurement. IT ternyata dipegang pusat…"
                      : `Add ${field.toLowerCase()}…`
                  }
                  value={fields[field] || ""}
                  onChange={(e) =>
                    setFields({ ...fields, [field]: e.target.value })
                  }
                />
              ) : (
                <input
                  required={i === 0}
                  maxLength={500}
                  value={fields[field] || ""}
                  placeholder={
                    field === "Company"
                      ? "e.g. Nusantara Logistik"
                      : `Add ${field.toLowerCase()}`
                  }
                  onChange={(e) =>
                    setFields({ ...fields, [field]: e.target.value })
                  }
                />
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-footer">
        <span className="muted">Output in Bahasa Indonesia</span>
        <button className="primary" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <ArrowUpRight size={18} />
          )}{" "}
          {busy ? "Thinking it through…" : "Generate insight"}
        </button>
      </div>
    </form>
  );
}
