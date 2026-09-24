"use client";
import Dashboard from "./dashboard";
import { useEffect, useState } from "react";
import {
  Home,
  Orbit,
  Inbox,
  Library,
  History,
  ArrowUpRight,
  Plus,
  Search,
  Sun,
  Moon,
  Building2,
  ChevronRight,
  Sparkles,
  MapPin,
  Users,
  MessageSquare,
  ScanLine,
  NotebookPen,
  Check,
  Pin,
  X,
  Download,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkspace } from "@/lib/use-workspace";
import { workflows } from "@/lib/workflows";
import type { Mode, SavedItem } from "@/lib/ai/types";
import { supabase } from "@/lib/supabase";
import Workflow from "./workflow";
import Result from "./result";
import Auth from "./auth";
const nav: [string, LucideIcon][] = [
  ["Home", Home],
  ["ACE", Orbit],
  ["Inbox", Inbox],
  ["Brain", Library],
  ["History", History],
];
const quick: [Mode, LucideIcon, string][] = [
  ["canvassing", MapPin, "Prepare Canvassing"],
  ["meeting", Users, "Prepare Meeting"],
  ["research", Search, "Research Company"],
  ["debrief", NotebookPen, "Debrief"],
  ["response", MessageSquare, "Before I Respond"],
  ["intel", ScanLine, "Deep Intel"],
];
export default function Workspace({ demo }: { demo: boolean }) {
  const store = useWorkspace(demo);
  const [page, setPage] = useState("Home"),
    [mode, setMode] = useState<Mode | null>(null),
    [result, setResult] = useState<SavedItem | null>(null),
    [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [companyFilter, setCompanyFilter] = useState("all"),
    [company, setCompany] = useState(""),
    [ask, setAsk] = useState(""),
    [initial, setInitial] = useState(""),
    [notice, setNotice] = useState(""),
    [dark, setDark] = useState(false),
    [pinned, setPinned] = useState(false),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    const theme = localStorage.getItem("bymee-theme") === "dark";
    setDark(theme);
    document.documentElement.dataset.theme = theme ? "dark" : "light";
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const companies = Array.from(
    new Set(store.items.map((x) => x.result.company).filter(Boolean)),
  );
  const pending = store.actions.filter((x) => !x.done);
  function navigate(next: string) {
    setPage(next);
    setMode(next === "Inbox" ? "inbox" : null);
    setResult(null);
    setCompany("");
    setInitial("");
    setQuery("");
  }
  function openMode(next: Mode, text = "") {
    setMode(next);
    setInitial(text);
    setResult(null);
    setCompany("");
    setPage(next === "inbox" ? "Inbox" : "ACE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openCompany(name: string) {
    setCompany(name);
    setMode(null);
    setResult(null);
    setPage("Account");
  }
  async function safely(work: () => Promise<void>, message: string) {
    try {
      await work();
      setNotice(message);
    } catch (e) {
      store.setError(
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String(e.message)
            : "Could not save. Please try again.",
      );
    }
  }
  function follow(item: SavedItem) {
    void safely(
      () =>
        store.action({
          id: crypto.randomUUID(),
          title: item.result.nextAction,
          company: item.result.company,
          done: false,
          due: new Date().toISOString().slice(0, 10),
        }),
      "Follow-up added to Today",
    );
  }
  const filtered = store.items.filter(
    (x) =>
      (type === "all" || x.mode === type) &&
      (companyFilter === "all" || x.result.company === companyFilter) &&
      (!pinned || x.pinned) &&
      JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
  );
  function itemList(items: SavedItem[]) {
    return items.length ? (
      <div className="item-list">
        {items.map((item) => (
          <div className="saved-row" key={item.id}>
            <button
              className="saved-main"
              onClick={() => {
                setResult(item);
                setMode(null);
                setCompany("");
              }}
            >
              <span className="mini-icon">
                <NotebookPen size={19} />
              </span>
              <span>
                <strong>{item.result.title}</strong>
                <small>
                  {item.result.company || "Personal workspace"} ·{" "}
                  {workflows[item.mode].title}
                </small>
              </span>
              <span className="date">
                {new Date(item.created_at).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
            <button
              aria-label={item.pinned ? "Unpin item" : "Pin item"}
              className={`icon-button ${item.pinned ? "is-pinned" : ""}`}
              onClick={() =>
                void safely(
                  () => store.pin(item),
                  item.pinned ? "Unpinned" : "Pinned",
                )
              }
            >
              <Pin size={16} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="empty">
        <Library size={28} />
        <h3>Room for your next insight.</h3>
        <p>Save a brief or capture a conversation to see it here.</p>
        <button className="text-button" onClick={() => openMode("inbox")}>
          Capture something <ArrowUpRight size={16} />
        </button>
      </div>
    );
  }
  const accountItems = store.items.filter((x) => x.result.company === company);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("Home")}
          aria-label="BYMEE home"
        >
          <span className="brand-mark">b.</span>BYMEE
          <span className="brand-dot" />
        </button>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              className={page === label ? "active" : ""}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              {label}
              {label === "Inbox" && <span className="nav-hint">↗</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="orbit-decoration">
            <Orbit size={26} />
          </div>
          <strong>
            A little more clarity.
            <br />A better next move.
          </strong>
          <p>Your context, connected.</p>
        </div>
        <div className="profile">
          <span className="avatar">
            {demo ? "D" : store.user?.[0]?.toUpperCase() || "B"}
          </span>
          <div>
            <strong>
              {demo
                ? "Demo workspace"
                : store.user?.split("@")[0] || "Your workspace"}
            </strong>
            <small>
              {demo ? "Local to this device" : "Private · Supabase"}
            </small>
          </div>
          {!demo && store.user && (
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={() => void supabase?.auth.signOut()}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>{page === "ACE" ? "ACE Intelligence" : page}</strong>
          </div>
          <div className="top-actions">
            <span className="status-dot" />
            <span className="mode-label">
              {demo ? "Demo mode" : "Cloud workspace"}
            </span>
            <button
              aria-label="Toggle dark mode"
              className="icon-button"
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.dataset.theme = next
                  ? "dark"
                  : "light";
                localStorage.setItem("bymee-theme", next ? "dark" : "light");
              }}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="avatar small"
              aria-label="Open personal brain"
              onClick={() => navigate("Brain")}
            >
              D
            </button>
          </div>
        </header>
        <main>
          {store.error && (
            <div className="error error-banner" role="alert">
              {store.error}
              <button
                aria-label="Dismiss error"
                className="icon-button"
                onClick={() => store.setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!store.ready ? (
            <div className="empty">Loading your workspace…</div>
          ) : !demo && !store.user ? (
            <Auth />
          ) : (
            <>
              {page === "Home" && !mode && !result && (
                <Dashboard
                  demo={demo}
                  store={store}
                  ask={ask}
                  setAsk={setAsk}
                  openMode={openMode}
                  openCompany={openCompany}
                  navigate={navigate}
                  safely={safely}
                  itemList={itemList}
                  quick={quick}
                />
              )}
              {page === "ACE" && !mode && !result && !company && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">CONTEXT BEFORE CONVERSATION</div>
                      <h1>ACE Intelligence</h1>
                      <p>Prepare with purpose. Follow the evidence.</p>
                    </div>
                  </div>
                  <div className="tools-grid">
                    {(
                      [
                        ...quick,
                        ["opportunity", Orbit, "Opportunity Analysis"],
                      ] as [Mode, LucideIcon, string][]
                    ).map(([key, Icon, title]) => (
                      <button
                        className="panel tool-card"
                        key={key}
                        onClick={() => openMode(key)}
                      >
                        <Icon size={26} />
                        <h2>{title}</h2>
                        <p>{workflows[key].description}</p>
                        <span className="text-button">
                          Open workspace <ArrowUpRight size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {mode && (
                <>
                  <button
                    className="text-button back"
                    onClick={() => navigate("ACE")}
                  >
                    ← All tools
                  </button>
                  <Workflow
                    savedItems={store.items}
                    key={`${mode}-${initial}`}
                    mode={mode}
                    initial={initial}
                    onResult={(item) => {
                      setResult(item);
                      setTimeout(
                        () =>
                          document
                            .getElementById("analysis-result")
                            ?.scrollIntoView({ behavior: "smooth" }),
                        100,
                      );
                    }}
                  />
                </>
              )}
              {result && (
                <div id="analysis-result">
                  <Result
                    item={result}
                    saved={
                      saving || store.items.some((x) => x.id === result.id)
                    }
                    onSave={() => {
                      setSaving(true);
                      void safely(
                        () => store.save(result),
                        "Saved to Personal Brain",
                      ).finally(() => setSaving(false));
                    }}
                    onFollow={() => follow(result)}
                    onCompany={openCompany}
                    onCopy={(text) =>
                      void safely(
                        () => navigator.clipboard.writeText(text),
                        "Response copied",
                      )
                    }
                  />
                </div>
              )}
              {(page === "Brain" || page === "History") && !result && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {page === "Brain"
                          ? "YOUR KNOWLEDGE, CONNECTED"
                          : "YOUR WORK IN CONTEXT"}
                      </div>
                      <h1>
                        {page === "Brain"
                          ? "Personal Brain"
                          : "Activity history"}
                      </h1>
                      <p>
                        {page === "Brain"
                          ? "Useful things deserve to be remembered."
                          : "Every brief, conversation, and next step."}
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => {
                        const url = URL.createObjectURL(
                          new Blob(
                            [
                              JSON.stringify(
                                { items: store.items, actions: store.actions },
                                null,
                                2,
                              ),
                            ],
                            { type: "application/json" },
                          ),
                        );
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "bymee-export.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download size={16} />
                      Export
                    </button>
                  </div>
                  <div className="filters">
                    <div className="search-field">
                      <Search size={18} />
                      <input
                        aria-label="Search knowledge"
                        placeholder="Search your knowledge…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="all">All types</option>
                      {Object.entries(workflows).map(([key, w]) => (
                        <option value={key} key={key}>
                          {w.title}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter company"
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                      <option value="all">All companies</option>
                      {companies.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      className={`secondary ${pinned ? "selected" : ""}`}
                      onClick={() => setPinned(!pinned)}
                    >
                      <Pin size={16} />
                      {pinned ? "Pinned only" : "Pinned"}
                    </button>
                  </div>
                  {itemList(filtered)}
                  {page === "History" && (
                    <section className="panel history-actions">
                      <h2>Follow-ups</h2>
                      {store.actions.map((a) => (
                        <label className="history-action" key={a.id}>
                          <input
                            type="checkbox"
                            checked={a.done}
                            onChange={() =>
                              void safely(
                                () => store.action({ ...a, done: !a.done }),
                                "Action updated",
                              )
                            }
                          />
                          <span>
                            {a.title}
                            <small>
                              {a.company} · {a.due}
                            </small>
                          </span>
                        </label>
                      ))}
                    </section>
                  )}
                </>
              )}
              {company && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">ACCOUNT MEMORY</div>
                      <h1>{company}</h1>
                      <p>Context accumulated from your saved work.</p>
                    </div>
                    <button
                      className="primary"
                      onClick={() => openMode("meeting", company)}
                    >
                      Prepare meeting <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="account-memory">
                    <section className="panel">
                      <h2>Known contacts</h2>
                      {Array.from(
                        new Set(accountItems.flatMap((x) => x.result.contacts)),
                      ).map((c) => (
                        <p className="contact" key={c}>
                          <Users size={17} />
                          {c}
                        </p>
                      ))}
                      {!accountItems.some((x) => x.result.contacts.length) && (
                        <p className="muted">No contacts captured yet.</p>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Next actions</h2>
                      {pending
                        .filter((x) => x.company === company)
                        .map((a) => (
                          <p key={a.id}>{a.title}</p>
                        ))}
                      {!pending.some((x) => x.company === company) && (
                        <p className="muted">No open follow-ups.</p>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Important facts</h2>
                      {accountItems
                        .flatMap((x) =>
                          x.result.sections
                            .filter((s) => s.label === "FACT")
                            .slice(0, 1),
                        )
                        .map((s, i) => (
                          <p key={i}>
                            {s.items.join(" ")}
                            <small>{s.source}</small>
                          </p>
                        ))}
                      {!accountItems.some((x) =>
                        x.result.sections.some((s) => s.label === "FACT"),
                      ) && (
                        <p className="muted">No supported facts saved yet.</p>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Hypotheses to validate</h2>
                      {accountItems
                        .flatMap((x) =>
                          x.result.sections
                            .filter((s) => s.label === "HYPOTHESIS")
                            .slice(0, 1),
                        )
                        .map((s, i) => (
                          <p key={i}>{s.items.join(" ")}</p>
                        ))}
                    </section>
                  </div>
                  {[
                    [
                      "Recent interactions",
                      accountItems.filter((x) => x.mode === "debrief"),
                    ],
                    [
                      "Saved research",
                      accountItems.filter((x) =>
                        ["research", "intel"].includes(x.mode),
                      ),
                    ],
                    [
                      "Opportunities",
                      accountItems.filter((x) => x.mode === "opportunity"),
                    ],
                    ["All account activity", accountItems],
                  ].map(([title, items]) => (
                    <section className="recent-section" key={String(title)}>
                      <h2>{String(title)}</h2>
                      {itemList(items as SavedItem[])}
                    </section>
                  ))}
                </>
              )}
            </>
          )}
        </main>
      </div>
      <nav className="mobile-nav">
        {nav.map(([label, Icon]) => (
          <button
            key={label}
            className={page === label ? "active" : ""}
            onClick={() => navigate(label)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button
        className="mobile-add"
        aria-label="Quick capture"
        onClick={() => openMode("inbox")}
      >
        <Plus size={24} />
      </button>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}
