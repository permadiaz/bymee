"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Auth() {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="panel auth"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const form = new FormData(e.currentTarget);
        try {
          if (!supabase)
            throw new Error(
              "Supabase is not configured. See README for setup.",
            );
          const credentials = {
            email: String(form.get("email")),
            password: String(form.get("password")),
          };
          const { error } = signup
            ? await supabase.auth.signUp(credentials)
            : await supabase.auth.signInWithPassword(credentials);
          if (error) throw error;
          if (signup)
            setMessage(
              "Check your email to confirm your account, then sign in.",
            );
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Authentication failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="eyebrow">YOUR PRIVATE WORKSPACE</div>
      <h2>{signup ? "Create your account" : "Welcome back"}</h2>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={8}
          autoComplete={signup ? "new-password" : "current-password"}
          required
        />
      </label>
      {message && <p role="status">{message}</p>}
      <button className="primary" disabled={busy}>
        {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => setSignup(!signup)}
      >
        {signup
          ? "Already have an account? Sign in"
          : "New to BYMEE? Create account"}
      </button>
    </form>
  );
}
