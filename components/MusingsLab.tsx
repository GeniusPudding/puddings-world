"use client";

import { useEffect, useState } from "react";
import type { Musing, Saying } from "@/content/musings";
import type { SourceKind } from "@/lib/gdocs";
import { MusingsCarousel } from "./MusingsCarousel";
import { SayingsCarousel } from "./SayingsCarousel";

type Row = { url: string; kind: SourceKind };
type SourceReport = {
  url: string;
  error?: string;
  docs: { title?: string; kind: string; pieces: number; sayings: number }[];
};
type Preview = { sources: SourceReport[]; musings: Musing[]; sayings: Saying[] };

const STORAGE_KEY = "musings-lab-rows";
const FIELD =
  "rounded-md border border-bg-border bg-bg-raised px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent/60 focus:outline-none";

function readRows(): Row[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rows = raw ? (JSON.parse(raw) as Row[]) : [];
    return Array.isArray(rows) && rows.length ? rows : [{ url: "", kind: "auto" }];
  } catch {
    return [{ url: "", kind: "auto" }];
  }
}

export function MusingsLab() {
  const [rows, setRows] = useState<Row[]>([{ url: "", kind: "auto" }]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setRows(readRows()), []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // Private mode: the rows just aren't remembered.
    }
  }, [rows]);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  /** Pasting several lines into one box splits them into rows. */
  function onPaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const lines = e.clipboardData.getData("text").split(/\s+/).filter((l) => l.startsWith("http"));
    if (lines.length < 2) return;
    e.preventDefault();
    setRows((rs) => [
      ...rs.slice(0, i),
      ...lines.map((url) => ({ url, kind: rs[i].kind })),
      ...rs.slice(i + 1),
    ]);
  }

  async function run() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/musings/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sources: rows.filter((r) => r.url.trim()) }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("Preview failed. Try again.");
      return;
    }
    setPreview((await res.json()) as Preview);
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 sm:px-6">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={r.url}
              onChange={(e) => update(i, { url: e.target.value })}
              onPaste={(e) => onPaste(i, e)}
              placeholder="https://docs.google.com/document/d/… or a Drive folder link"
              className={`${FIELD} min-w-0 flex-1`}
            />
            <div className="flex gap-2">
              <select
                value={r.kind}
                onChange={(e) => update(i, { kind: e.target.value as SourceKind })}
                className={`${FIELD} flex-1 sm:flex-none`}
              >
                <option value="auto">auto</option>
                <option value="lyrics">lyrics</option>
                <option value="sayings">sayings</option>
              </select>
              <button
                type="button"
                onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs))}
                className="rounded-md border border-bg-border px-3 font-mono text-xs text-ink-muted hover:text-accent-red"
                aria-label="Remove link"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { url: "", kind: "auto" }])}
            className="rounded-md border border-bg-border px-3 py-2 font-mono text-xs text-ink-muted hover:text-ink-primary"
          >
            + link
          </button>
          <button
            type="button"
            onClick={run}
            disabled={busy || !rows.some((r) => r.url.trim())}
            className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-xs text-accent hover:bg-accent/20 disabled:opacity-50"
          >
            {busy ? "reading docs…" : "preview →"}
          </button>
        </div>
        {error && <p className="text-xs text-accent-red">{error}</p>}

        {preview && (
          <ul className="mt-6 space-y-2 rounded-lg border border-bg-border bg-bg-panel p-4 text-xs">
            {preview.sources.map((s, i) => (
              <li key={i} className="min-w-0">
                <p className="truncate font-mono text-ink-muted">{s.url}</p>
                {s.error ? (
                  <p className="text-accent-red">{s.error}</p>
                ) : (
                  s.docs.map((d, j) => (
                    <p key={j} className="text-ink-secondary">
                      <span className="text-ink-primary">{d.title ?? "untitled"}</span> · {d.kind} ·{" "}
                      {d.kind === "lyrics" ? `${d.pieces} song(s)` : `${d.sayings} saying(s)`}
                    </p>
                  ))
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {preview && preview.musings.length > 0 && (
        <div className="mx-auto mt-14 w-full max-w-6xl px-2 sm:px-6">
          <MusingsCarousel musings={preview.musings} linkable={false} />
        </div>
      )}
      {preview && preview.sayings.length > 0 && (
        <div className="mt-14">
          <SayingsCarousel sayings={preview.sayings} />
        </div>
      )}
    </div>
  );
}
