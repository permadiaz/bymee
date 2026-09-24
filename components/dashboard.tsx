"use client";
import {
  ArrowUpRight,
  Sparkles,
  Check,
  Building2,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Mode, SavedItem } from "@/lib/ai/types";
import type { useWorkspace } from "@/lib/use-workspace";
type Props = {
  demo: boolean;
  store: ReturnType<typeof useWorkspace>;
  ask: string;
  setAsk: (s: string) => void;
  openMode: (m: Mode, s?: string) => void;
  openCompany: (s: string) => void;
  navigate: (s: string) => void;
  safely: (f: () => Promise<void>, s: string) => Promise<void>;
  itemList: (items: SavedItem[]) => ReactNode;
  quick: [Mode, LucideIcon, string][];
};
export default function Dashboard({
  demo,
  store,
  ask,
  setAsk,
  openMode,
  openCompany,
  navigate,
  safely,
  itemList,
  quick,
}: Props) {
  const pending = store.actions.filter((a) => !a.done);
  const companies = Array.from(
    new Set(store.items.map((i) => i.result.company).filter(Boolean)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL WORK OS</div>
          <h1>
            Make room for <span>your next move.</span>
          </h1>
          <p>Less scattered information. More meaningful conversations.</p>
        </div>
        <span className="today-date">
          {new Date().toLocaleDateString("en", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <form
        className="ask-panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (ask.trim()) openMode("inbox", ask);
        }}
      >
        <div className="section-heading">
          <h2>
            <Sparkles size={20} />
            Ask BYMEE
          </h2>
          <span className="subtle-label">START ANYWHERE</span>
        </div>
        <textarea
          aria-label="Ask BYMEE"
          required
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="What happened, what are you preparing for, or what do you need to figure out?"
        />
        <div className="ask-footer">
          <span>Paste a message, capture a thought, connect the dots.</span>
          <button className="primary" type="submit">
            Find clarity <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
      <section className="quick-section">
        <div className="section-heading">
          <h2>Get a head start</h2>
          <span className="muted">A little preparation goes a long way.</span>
        </div>
        <div className="quick-grid">
          {quick.map(([key, Icon, title]) => (
            <button
              key={key}
              className="quick-card"
              onClick={() => openMode(key)}
            >
              <Icon size={22} />
              <span>{title}</span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel today-panel">
          <div className="section-heading">
            <h2>
              Today <span className="count">{pending.length}</span>
            </h2>
            <span className="subtle-label">ONE STEP AT A TIME</span>
          </div>
          {pending.length ? (
            pending.map((a) => (
              <div className="action-row" key={a.id}>
                <button
                  className="checkbox"
                  aria-label={`Complete ${a.title}`}
                  onClick={() =>
                    void safely(
                      () => store.action({ ...a, done: true }),
                      "Action completed",
                    )
                  }
                >
                  <Check size={13} />
                </button>
                <div>
                  <strong>{a.title}</strong>
                  <button
                    className="account-link"
                    onClick={() => a.company && openCompany(a.company)}
                  >
                    {a.company || "Personal"} <span>· {a.due}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty small-empty">
              <Check size={24} />
              <p>You’re all caught up. Create a follow-up from any insight.</p>
            </div>
          )}
          <div className="panel-footer">
            <span>{store.actions.filter((x) => x.done).length} completed</span>
            <button className="text-button" onClick={() => navigate("History")}>
              View activity <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section className="panel accounts-panel">
          <div className="section-heading">
            <h2>Recent accounts</h2>
            <Building2 size={18} />
          </div>
          {companies.slice(0, 3).map((name, i) => (
            <button
              className="account-row"
              key={name}
              onClick={() => openCompany(name)}
            >
              <span className={`company-avatar color-${i}`}>
                {name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span>
                <strong>{name}</strong>
                <small>
                  {store.items.filter((x) => x.result.company === name).length}{" "}
                  saved insight
                  {store.items.filter((x) => x.result.company === name).length >
                  1
                    ? "s"
                    : ""}
                </small>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
          {!companies.length && (
            <p className="muted">
              Save work with a company name to build its memory.
            </p>
          )}
          <div className="account-note">
            <span className="status-dot" />
            Context grows with every conversation.
          </div>
        </section>
      </div>
      <section className="recent-section">
        <div className="section-heading">
          <h2>Pick up where you left off</h2>
          <button className="text-button" onClick={() => navigate("Brain")}>
            Open Brain <ArrowUpRight size={15} />
          </button>
        </div>
        {itemList(store.items.slice(0, 3))}
      </section>
      <div className="workspace-footnote">
        {demo
          ? "Sample companies are fictional. Demo analysis is illustrative and saved only in this browser."
          : "Your work is private and protected by account-level access policies."}
      </div>
    </>
  );
}
