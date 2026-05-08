"use client";

import { useEffect, useMemo, useState } from "react";
import type { Song, StatePublic } from "@/lib/ktv/types";

type FetchStatus =
  | { kind: "loading" }
  | { kind: "ready"; state: StatePublic }
  | { kind: "service_unavailable" }
  | { kind: "error"; message: string };

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; position: number }
  | { kind: "duplicate"; position: number }
  | { kind: "rate_limit" }
  | { kind: "not_accepting" }
  | { kind: "error"; message: string };

const LANG_LABEL: Record<Song["language"], string> = {
  zh: "中文",
  en: "EN",
  jp: "日",
  ko: "韓",
  other: "—",
};

export function KtvMenu({ catalog }: { catalog: Song[] }) {
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    kind: "loading",
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Song | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submit, setSubmit] = useState<SubmitStatus>({ kind: "idle" });

  // Poll state every 8s so audience can see queue advance and now-playing change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ktv/state", { cache: "no-store" });
        if (!res.ok) {
          if (cancelled) return;
          if (res.status === 503) {
            setFetchStatus({ kind: "service_unavailable" });
          } else {
            setFetchStatus({
              kind: "error",
              message: `service responded ${res.status}`,
            });
          }
          return;
        }
        const state: StatePublic = await res.json();
        if (!cancelled) setFetchStatus({ kind: "ready", state });
      } catch (err) {
        if (!cancelled)
          setFetchStatus({
            kind: "error",
            message: err instanceof Error ? err.message : "network error",
          });
      }
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((s) => {
      const hay = `${s.title} ${s.artist} ${s.tags?.join(" ") ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query]);

  function openSheet(song: Song) {
    setSelected(song);
    setSubmit({ kind: "idle" });
  }

  function closeSheet() {
    setSelected(null);
    setName("");
    setMessage("");
    setSubmit({ kind: "idle" });
  }

  async function submitRequest() {
    if (!selected) return;
    setSubmit({ kind: "submitting" });
    try {
      const res = await fetch("/api/ktv/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: selected.id,
          requesterName: name.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmit({ kind: "ok", position: body.position ?? 0 });
        // Refresh state so the header counter reflects the new queue length
        fetch("/api/ktv/state", { cache: "no-store" })
          .then((r) => r.json())
          .then((s: StatePublic) =>
            setFetchStatus({ kind: "ready", state: s }),
          )
          .catch(() => {});
        return;
      }
      switch (body.error) {
        case "rate_limit":
          setSubmit({ kind: "rate_limit" });
          break;
        case "duplicate":
          setSubmit({ kind: "duplicate", position: body.position ?? 0 });
          break;
        case "not_accepting":
          setSubmit({ kind: "not_accepting" });
          break;
        default:
          setSubmit({
            kind: "error",
            message: body.error ?? `submit failed (${res.status})`,
          });
      }
    } catch (err) {
      setSubmit({
        kind: "error",
        message: err instanceof Error ? err.message : "network error",
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (fetchStatus.kind === "loading") {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-6 py-16">
        <p className="font-mono text-sm text-ink-muted">loading…</p>
      </main>
    );
  }

  if (fetchStatus.kind === "service_unavailable") {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
          street ktv
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Service warming up
        </h1>
        <p className="mt-3 text-sm text-ink-secondary">
          The performer hasn&apos;t connected the queue yet. Please try again
          in a moment.
        </p>
      </main>
    );
  }

  if (fetchStatus.kind === "error") {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 font-mono text-xs text-ink-muted">
          {fetchStatus.message}
        </p>
      </main>
    );
  }

  const { state } = fetchStatus;
  const closed = !state.acceptingRequests;

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-32 pt-10">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          street ktv
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Pick a song.
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          {state.queueLength} song{state.queueLength === 1 ? "" : "s"} in queue.
          {state.nowPlaying ? (
            <>
              {" "}
              Now playing:{" "}
              <span className="text-ink-primary">{state.nowPlaying.title}</span>
              <span className="text-ink-muted"> · {state.nowPlaying.artist}</span>
            </>
          ) : (
            " Performer is between songs."
          )}
        </p>
        {closed && (
          <div className="mt-4 rounded-md border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 font-mono text-xs text-accent-amber">
            queue closed — performer not accepting new requests right now
          </div>
        )}
      </header>

      <div className="sticky top-[68px] z-10 -mx-5 mb-4 bg-bg-base/85 px-5 py-3 backdrop-blur">
        <input
          type="search"
          inputMode="search"
          placeholder="search by title, artist, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-bg-border bg-bg-panel px-4 py-3 text-base text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
          aria-label="search songs"
        />
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <li className="rounded-lg border border-bg-border bg-bg-panel/40 px-4 py-6 text-center font-mono text-sm text-ink-muted">
            no matches for &ldquo;{query}&rdquo;
          </li>
        )}
        {filtered.map((song) => (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => openSheet(song)}
              disabled={closed}
              className="flex w-full items-baseline justify-between gap-3 rounded-lg border border-bg-border bg-bg-panel px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-bg-raised disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-bg-border disabled:hover:bg-bg-panel"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-base text-ink-primary">
                  {song.title}
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                  {song.artist}
                  {song.tags?.length ? ` · ${song.tags.slice(0, 2).join(" / ")}` : ""}
                </div>
              </div>
              <span className="shrink-0 rounded border border-bg-border bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                {LANG_LABEL[song.language]}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <RequestSheet
          song={selected}
          name={name}
          message={message}
          submit={submit}
          onName={setName}
          onMessage={setMessage}
          onSubmit={submitRequest}
          onClose={closeSheet}
        />
      )}
    </main>
  );
}

function RequestSheet({
  song,
  name,
  message,
  submit,
  onName,
  onMessage,
  onSubmit,
  onClose,
}: {
  song: Song;
  name: string;
  message: string;
  submit: SubmitStatus;
  onName: (v: string) => void;
  onMessage: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const submitted = submit.kind === "ok";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="confirm song request"
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg-base/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-bg-border bg-bg-panel p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {!submitted ? (
          <>
            <header>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                you&apos;re requesting
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
                {song.title}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                {song.artist}
              </p>
            </header>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Your name (optional)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onName(e.target.value)}
                  maxLength={30}
                  placeholder="how should I introduce you?"
                  className="mt-1 w-full rounded-lg border border-bg-border bg-bg-raised px-3 py-2.5 text-base text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Message / dedication (optional)
                </span>
                <textarea
                  value={message}
                  onChange={(e) => onMessage(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="for someone? a request to me?"
                  className="mt-1 w-full resize-none rounded-lg border border-bg-border bg-bg-raised px-3 py-2.5 text-base text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
                />
              </label>
            </div>

            {submit.kind === "rate_limit" && (
              <p className="mt-3 text-sm text-accent-amber">
                Just sent one — give it 30 seconds and try again.
              </p>
            )}
            {submit.kind === "duplicate" && (
              <p className="mt-3 text-sm text-accent-amber">
                Already in queue — currently #{submit.position}.
              </p>
            )}
            {submit.kind === "not_accepting" && (
              <p className="mt-3 text-sm text-accent-amber">
                Queue just closed. Catch the performer next set.
              </p>
            )}
            {submit.kind === "error" && (
              <p className="mt-3 text-sm text-accent-red">
                {submit.message}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-bg-border bg-bg-raised py-3 font-mono text-sm text-ink-secondary transition-colors hover:text-ink-primary"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submit.kind === "submitting"}
                className="flex-[2] rounded-lg border border-accent bg-accent/15 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/25 disabled:opacity-50"
              >
                {submit.kind === "submitting" ? "sending…" : "send request →"}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="font-mono text-3xl text-accent-green">✓</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              You&apos;re in.
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              <span className="text-ink-primary">{song.title}</span> queued at{" "}
              <span className="font-mono text-accent">#{submit.position}</span>.
              Hang around and listen for it.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg border border-bg-border bg-bg-raised py-3 font-mono text-sm text-ink-primary transition-colors hover:bg-bg-panel"
            >
              pick another song →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
