"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      router.refresh();
      return;
    }
    const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setError(body?.error ?? "Network error.");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-24 max-w-sm space-y-3 rounded-lg border border-bg-border bg-bg-panel p-5"
    >
      <label className="block">
        <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-ink-muted">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="w-full rounded-md border border-bg-border bg-bg-raised px-3 py-2 text-sm text-ink-primary focus:border-accent/60 focus:outline-none"
        />
      </label>
      {error && <p className="text-xs text-accent-red">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        {busy ? "…" : "sign in →"}
      </button>
    </form>
  );
}
