"use client";
import { useEffect, useState } from "react";
import type { SavedItem, Action } from "./ai/types";
import { seedItems, seedActions } from "./seed";
import { supabase } from "./supabase";
export function useWorkspace(demo: boolean) {
  const [items, setItems] = useState<SavedItem[]>([]),
    [actions, setActions] = useState<Action[]>([]),
    [ready, setReady] = useState(false),
    [user, setUser] = useState<string | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) {
      try {
        const stored = localStorage.getItem("bymee-v1");
        if (stored) {
          const data = JSON.parse(stored);
          setItems(data.items);
          setActions(data.actions);
        } else {
          setItems(seedItems());
          setActions(seedActions());
        }
      } catch {
        setError(
          "Saved data could not be loaded. Please export or check browser storage.",
        );
      }
      setReady(true);
      return;
    }
    if (!supabase) {
      setError("Configure Supabase to use cloud mode.");
      setReady(true);
      return;
    }
    let active = true;
    const load = async () => {
      if (!supabase) return;
      setReady(false);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setUser(session?.user.email || null);
      setItems([]);
      setActions([]);
      if (session) {
        const [a, b] = await Promise.all([
          supabase
            .from("knowledge_items")
            .select("payload")
            .order("created_at", { ascending: false }),
          supabase.from("next_actions").select("id,title,company,done,due"),
        ]);
        if (!active) return;
        if (a.error || b.error)
          setError(
            a.error?.message || b.error?.message || "Could not load data",
          );
        else {
          setItems((a.data || []).map((x) => x.payload as SavedItem));
          setActions((b.data || []) as Action[]);
        }
      }
      setReady(true);
    };
    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void load(), 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [demo]);
  function persist(nextItems: SavedItem[], nextActions: Action[]) {
    if (demo)
      localStorage.setItem(
        "bymee-v1",
        JSON.stringify({ items: nextItems, actions: nextActions }),
      );
  }
  async function save(item: SavedItem) {
    if (!demo) {
      if (!supabase || !user) throw new Error("Sign in before saving.");
      const { error } = await supabase.rpc("save_activity", { activity: item });
      if (error) throw error;
    }
    const next = [item, ...items.filter((x) => x.id !== item.id)];
    persist(next, actions);
    setItems(next);
  }
  async function pin(item: SavedItem) {
    await save({ ...item, pinned: !item.pinned });
  }
  async function action(value: Action) {
    if (!demo) {
      if (!supabase || !user)
        throw new Error("Sign in before adding an action.");
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("next_actions")
        .upsert({ ...value, user_id: current?.id });
      if (error) throw error;
    }
    const next = [value, ...actions.filter((x) => x.id !== value.id)];
    persist(items, next);
    setActions(next);
  }
  return { items, actions, ready, user, error, setError, save, pin, action };
}
