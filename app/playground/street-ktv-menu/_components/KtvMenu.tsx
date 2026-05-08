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

/** A row this browser put into the queue; persisted so we can DELETE it later. */
type MyRequest = {
  id: string;
  cancelToken: string;
  songId: string;
  /** ISO 8601 — used to keep just-added rows from being pruned during the
   *  brief window before the edge cache catches up. */
  addedAt: string;
};

const LANG_LABEL: Record<Song["language"], string> = {
  zh: "中文",
  en: "EN",
  jp: "日",
  ko: "韓",
  other: "—",
};

const POLL_INTERVAL_MS = 5000;
const MY_REQUESTS_KEY = "ktv:my-requests";
// Keep newly-added rows around at least this long before allowing the
// "not in live queue → prune" rule to drop them. Edge cache on /state can
// serve up to 2s stale, so 10s is a comfortable buffer.
const MIN_PRUNE_AGE_MS = 10_000;

function loadMyRequests(): MyRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_REQUESTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MyRequest =>
        !!r &&
        typeof r === "object" &&
        typeof (r as MyRequest).id === "string" &&
        typeof (r as MyRequest).cancelToken === "string" &&
        typeof (r as MyRequest).songId === "string" &&
        typeof (r as MyRequest).addedAt === "string",
    );
  } catch {
    return [];
  }
}

function saveMyRequests(reqs: MyRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(reqs));
  } catch {
    /* quota / private mode — quietly ignore */
  }
}

export function KtvMenu({ catalog }: { catalog: Song[] }) {
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    kind: "loading",
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Song | null>(null);
  const [submit, setSubmit] = useState<SubmitStatus>({ kind: "idle" });
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);

  // Hydrate "my queued songs" from localStorage on mount only — leaving
  // initial state empty avoids SSR/CSR hydration mismatch.
  useEffect(() => {
    setMyRequests(loadMyRequests());
  }, []);

  // Whenever fresh state arrives, drop tracked rows that are no longer in
  // the live queue (sung, canceled, or a fresh gig wiped the queue).
  // Spare anything younger than MIN_PRUNE_AGE_MS so edge-cache lag right
  // after a POST can't accidentally evict the row we just added.
  useEffect(() => {
    if (fetchStatus.kind !== "ready") return;
    const liveIds = new Set<string>(
      fetchStatus.state.queue.map((q) => q.id),
    );
    if (fetchStatus.state.nowPlayingId)
      liveIds.add(fetchStatus.state.nowPlayingId);
    const now = Date.now();
    setMyRequests((prev) => {
      const next = prev.filter(
        (r) =>
          liveIds.has(r.id) ||
          now - new Date(r.addedAt).getTime() < MIN_PRUNE_AGE_MS,
      );
      if (next.length === prev.length) return prev;
      saveMyRequests(next);
      return next;
    });
  }, [fetchStatus]);

  // Poll state every few seconds so audience sees queue advance + now-playing.
  // Pauses when the tab is hidden — backgrounded phones don't need to keep
  // hammering the API.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
        // Hits Vercel's edge cache (s-maxage=2) most of the time; default
        // browser cache mode is fine.
        const res = await fetch("/api/ktv/state");
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

    function startPolling() {
      if (timer) return;
      load();
      timer = setInterval(load, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (typeof document !== "undefined") {
      if (document.visibilityState === "visible") startPolling();
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      stopPolling();
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

  const queuedSongIds = useMemo(() => {
    if (fetchStatus.kind !== "ready") return new Set<string>();
    const ids = new Set(fetchStatus.state.queue.map((q) => q.songId));
    if (fetchStatus.state.nowPlaying)
      ids.add(fetchStatus.state.nowPlaying.songId);
    return ids;
  }, [fetchStatus]);

  function openSheet(song: Song) {
    setSelected(song);
    setSubmit({ kind: "idle" });
  }

  function closeSheet() {
    setSelected(null);
    setSubmit({ kind: "idle" });
  }

  async function refreshState() {
    // Cache-buster query bypasses Vercel's edge cache (s-maxage=2) so the
    // newly-added row appears immediately instead of after up to 2s.
    try {
      const r = await fetch(`/api/ktv/state?_=${Date.now()}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const s: StatePublic = await r.json();
      setFetchStatus({ kind: "ready", state: s });
    } catch {
      /* ignore — next polling tick will catch up */
    }
  }

  async function submitRequest() {
    if (!selected) return;
    setSubmit({ kind: "submitting" });
    try {
      const res = await fetch("/api/ktv/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: selected.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmit({ kind: "ok", position: body.position ?? 0 });
        if (
          typeof body.id === "string" &&
          typeof body.cancelToken === "string"
        ) {
          const entry: MyRequest = {
            id: body.id,
            cancelToken: body.cancelToken,
            songId: selected.id,
            addedAt: new Date().toISOString(),
          };
          setMyRequests((prev) => {
            const next = [...prev, entry];
            saveMyRequests(next);
            return next;
          });
        }
        refreshState();
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

  async function cancelMyRequest(id: string) {
    const entry = myRequests.find((r) => r.id === id);
    if (!entry) return;
    // Optimistic: remove locally first, restore only if the server
    // explicitly says "you don't own this" (401).
    setMyRequests((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveMyRequests(next);
      return next;
    });
    try {
      const res = await fetch(`/api/ktv/queue/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "X-Cancel-Token": entry.cancelToken },
      });
      // 204 = deleted, 404 = already gone (performer beat us to it). Both fine.
      if (!res.ok && res.status === 401) {
        // Token mismatch (shouldn't happen) — restore the entry so the user
        // can try again or at least see it.
        setMyRequests((prev) => {
          const next = [...prev, entry];
          saveMyRequests(next);
          return next;
        });
      }
    } catch {
      /* network blip — leave optimistic state, next poll will reconcile */
    }
    refreshState();
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
  const queueEmpty = !state.nowPlaying && state.queue.length === 0;

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
          Tap any song to add it to the live queue. Updates every few seconds.
        </p>
        {closed && (
          <div className="mt-4 rounded-md border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 font-mono text-xs text-accent-amber">
            queue closed — performer not accepting new requests right now
          </div>
        )}
      </header>

      <LiveQueue
        state={state}
        myIds={new Set(myRequests.map((r) => r.id))}
        onCancel={cancelMyRequest}
      />

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
        {filtered.map((song) => {
          const alreadyQueued = queuedSongIds.has(song.id);
          return (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => openSheet(song)}
                disabled={closed || alreadyQueued}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg border border-bg-border bg-bg-panel px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-bg-raised disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-bg-border disabled:hover:bg-bg-panel"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base text-ink-primary">
                    {song.title}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                    {song.artist}
                    {song.tags?.length
                      ? ` · ${song.tags.slice(0, 2).join(" / ")}`
                      : ""}
                    {alreadyQueued && (
                      <span className="ml-2 text-accent-amber">
                        · already queued
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded border border-bg-border bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  {LANG_LABEL[song.language]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <ConfirmSheet
          song={selected}
          submit={submit}
          onConfirm={submitRequest}
          onClose={closeSheet}
        />
      )}
    </main>
  );
}

function LiveQueue({
  state,
  myIds,
  onCancel,
}: {
  state: StatePublic;
  myIds: Set<string>;
  onCancel: (id: string) => void;
}) {
  const empty = !state.nowPlaying && state.queue.length === 0;

  if (empty) {
    return (
      <section className="mb-6 rounded-xl border border-dashed border-bg-border bg-bg-panel/40 px-4 py-5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          live queue
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          Queue is empty. Be the first to pick a song.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-3">
      {state.nowPlaying && (
        <div className="rounded-xl border border-accent-green/40 bg-accent-green/5 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full bg-accent-green"
              aria-hidden
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-green">
              now playing
            </p>
          </div>
          <p className="mt-1.5 text-base text-ink-primary">
            {state.nowPlaying.title}
          </p>
          <p className="font-mono text-xs text-ink-muted">
            {state.nowPlaying.artist}
          </p>
        </div>
      )}

      {state.queue.length > 0 && (
        <div className="rounded-xl border border-bg-border bg-bg-panel px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            up next ({state.queue.length})
          </p>
          <ol className="mt-2 space-y-1.5 text-sm">
            {state.queue.slice(0, 5).map((q, i) => {
              const mine = myIds.has(q.id);
              return (
                <li
                  key={q.id}
                  className="flex items-center gap-2"
                >
                  <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-ink-primary">{q.title}</span>
                    <span className="ml-1 font-mono text-[10px] text-ink-muted">
                      · {q.artist}
                    </span>
                    {mine && (
                      <span className="ml-1.5 font-mono text-[10px] text-accent">
                        · yours
                      </span>
                    )}
                  </span>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => onCancel(q.id)}
                      aria-label={`cancel ${q.title}`}
                      className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-bg-border bg-bg-raised font-mono text-xs text-ink-muted transition-colors hover:border-accent-red hover:text-accent-red"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
            {state.queue.length > 5 && (
              <li className="font-mono text-[10px] text-ink-muted">
                + {state.queue.length - 5} more queued
              </li>
            )}
          </ol>
        </div>
      )}
    </section>
  );
}

function ConfirmSheet({
  song,
  submit,
  onConfirm,
  onClose,
}: {
  song: Song;
  submit: SubmitStatus;
  onConfirm: () => void;
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
                add to queue?
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">
                {song.title}
              </h2>
              <p className="mt-0.5 font-mono text-sm text-ink-muted">
                {song.artist}
              </p>
            </header>

            {submit.kind === "rate_limit" && (
              <p className="mt-4 text-sm text-accent-amber">
                Just sent one — give it 30 seconds and try again.
              </p>
            )}
            {submit.kind === "duplicate" && (
              <p className="mt-4 text-sm text-accent-amber">
                Already in queue — currently #{submit.position}.
              </p>
            )}
            {submit.kind === "not_accepting" && (
              <p className="mt-4 text-sm text-accent-amber">
                Queue just closed. Catch the performer next set.
              </p>
            )}
            {submit.kind === "error" && (
              <p className="mt-4 text-sm text-accent-red">{submit.message}</p>
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-bg-border bg-bg-raised py-3.5 font-mono text-sm text-ink-secondary transition-colors hover:text-ink-primary"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={submit.kind === "submitting"}
                className="flex-[2] rounded-lg border border-accent bg-accent/15 py-3.5 font-mono text-sm text-accent transition-colors hover:bg-accent/25 disabled:opacity-50"
              >
                {submit.kind === "submitting" ? "sending…" : "confirm →"}
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="font-mono text-3xl text-accent-green">✓</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Added.
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">
              <span className="text-ink-primary">{song.title}</span> queued at{" "}
              <span className="font-mono text-accent">#{submit.position}</span>.
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
