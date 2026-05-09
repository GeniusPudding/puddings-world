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
  zh: "中",
  en: "EN",
  jp: "日",
  ko: "韓",
  other: "—",
};

// Audience polls /api/ktv/state every 1 s for near-instant queue updates.
// Edge cache (s-maxage=2) collapses the high poll rate at the CDN, so KV
// cost stays flat regardless of audience size.
const POLL_INTERVAL_MS = 1000;
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

  // Poll state every second so audience sees queue advance + now-playing.
  // Pauses when the tab is hidden — backgrounded phones don't need to keep
  // hammering the API.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      try {
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
      if (!res.ok && res.status === 401) {
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
    return <LoadingScreen />;
  }
  if (fetchStatus.kind === "service_unavailable") {
    return <ServiceUnavailableScreen />;
  }
  if (fetchStatus.kind === "error") {
    return <ErrorScreen message={fetchStatus.message} />;
  }

  const { state } = fetchStatus;
  const closed = !state.acceptingRequests;
  const queueCount =
    state.queue.length + (state.nowPlaying ? 1 : 0);

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-32 pt-8 sm:max-w-lg sm:px-6 sm:pt-12">
      {/* Compact header: brand mark + live status pill */}
      <header className="mb-7">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            street ktv
          </p>
          <LiveStatus
            closed={closed}
            songCount={catalog.length}
            queueCount={queueCount}
          />
        </div>
        <h1 className="mt-5 font-serif text-[2.25rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Pick a song.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Tap any song below to add it to the live queue. Updates within a second.
        </p>
        {closed && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3.5 py-2.5 text-[13px] text-accent-amber">
            <span aria-hidden className="mt-0.5">⏸</span>
            <span>
              <span className="font-medium">Queue is paused.</span> The performer
              isn’t accepting new requests right now.
            </span>
          </div>
        )}
      </header>

      <LiveQueue
        state={state}
        myIds={new Set(myRequests.map((r) => r.id))}
        onCancel={cancelMyRequest}
      />

      {/* Sticky search — backdrop blur lets the song list scroll under it.
          Top offset clears the site nav (which is also sticky `top-0`).
          Mobile nav wraps to 2-3 rows so we leave more room there. */}
      <div className="sticky top-[100px] z-10 -mx-5 mb-3 bg-bg-base/90 px-5 pb-3 pt-2 backdrop-blur-md sm:top-[60px] sm:-mx-6 sm:px-6">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <SongList
        songs={filtered}
        query={query}
        queuedSongIds={queuedSongIds}
        closed={closed}
        onPick={openSheet}
      />

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

// ── Header status ───────────────────────────────────────────────────────

function LiveStatus({
  closed,
  songCount,
  queueCount,
}: {
  closed: boolean;
  songCount: number;
  queueCount: number;
}) {
  if (closed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-amber">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-amber" />
        paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-green/30 bg-accent-green/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-green">
      <span
        aria-hidden
        className="ktv-pulse h-1.5 w-1.5 rounded-full bg-accent-green"
      />
      live · {songCount} song{songCount === 1 ? "" : "s"}
      {queueCount > 0 && <span> · {queueCount} queued</span>}
    </span>
  );
}

// ── Queue + Now Playing card ───────────────────────────────────────────

function LiveQueue({
  state,
  myIds,
  onCancel,
}: {
  state: StatePublic;
  myIds: Set<string>;
  onCancel: (id: string) => void;
}) {
  const { nowPlaying, queue } = state;
  const empty = !nowPlaying && queue.length === 0;

  if (empty) {
    return (
      <section className="ktv-fade-in mb-7 rounded-2xl border border-dashed border-bg-border bg-bg-panel/40 px-5 py-7 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          live queue
        </p>
        <p className="mt-2.5 text-[15px] text-ink-secondary">
          Empty.
        </p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Be the first to pick a song.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-7 space-y-3">
      {nowPlaying && (
        <div
          className="ktv-fade-in relative overflow-hidden rounded-2xl border border-accent-green/40 px-5 py-4"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-green) 8%, transparent), color-mix(in srgb, var(--color-accent-green) 2%, transparent))",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="ktv-pulse inline-block h-2 w-2 rounded-full bg-accent-green"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-green">
              now playing
            </p>
          </div>
          <p className="mt-2 truncate text-lg font-medium leading-snug text-ink-primary">
            {nowPlaying.title}
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
            {nowPlaying.artist}
          </p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="rounded-2xl border border-bg-border bg-bg-panel px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              up next
            </p>
            <span className="rounded-full bg-bg-raised px-2 py-0.5 font-mono text-[10px] text-ink-secondary">
              {queue.length}
            </span>
          </div>
          <ol className="mt-3 space-y-2.5">
            {queue.slice(0, 5).map((q, i) => {
              const mine = myIds.has(q.id);
              return (
                <li
                  key={q.id}
                  className="ktv-fade-in flex items-center gap-3"
                >
                  <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-ink-primary">
                      {q.title}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">
                      {q.artist}
                      {mine && (
                        <span className="ml-1.5 text-accent">· yours</span>
                      )}
                    </p>
                  </div>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => onCancel(q.id)}
                      aria-label={`cancel ${q.title}`}
                      className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-bg-border bg-bg-raised text-base text-ink-muted transition-colors hover:border-accent-red/50 hover:bg-accent-red/10 hover:text-accent-red active:scale-95"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
            {queue.length > 5 && (
              <li className="pt-1 font-mono text-[11px] text-ink-muted">
                + {queue.length - 5} more queued
              </li>
            )}
          </ol>
        </div>
      )}
    </section>
  );
}

// ── Search ──────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-muted"
      >
        ⌕
      </span>
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="search title, artist, tag…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-bg-border bg-bg-panel pl-10 pr-12 py-3.5 text-[15px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:bg-bg-raised focus:outline-none focus:ring-2 focus:ring-accent/20"
        aria-label="search songs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="clear search"
          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg-raised hover:text-ink-primary active:scale-95"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Songbook list ───────────────────────────────────────────────────────

function SongList({
  songs,
  query,
  queuedSongIds,
  closed,
  onPick,
}: {
  songs: Song[];
  query: string;
  queuedSongIds: Set<string>;
  closed: boolean;
  onPick: (s: Song) => void;
}) {
  if (songs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-bg-border bg-bg-panel/30 px-4 py-10 text-center">
        <p className="font-mono text-sm text-ink-muted">
          no matches for &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {songs.map((song) => {
        const alreadyQueued = queuedSongIds.has(song.id);
        const disabled = closed || alreadyQueued;
        return (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => onPick(song)}
              disabled={disabled}
              className="group flex w-full min-h-[60px] items-center justify-between gap-3 rounded-xl border border-bg-border bg-bg-panel px-4 py-3.5 text-left transition-all hover:border-accent/60 hover:bg-bg-raised active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-bg-border disabled:hover:bg-bg-panel disabled:active:scale-100"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] leading-tight text-ink-primary">
                  {song.title}
                </div>
                <div className="mt-1 flex items-center gap-1.5 truncate font-mono text-[11px] text-ink-muted">
                  <span className="truncate">{song.artist}</span>
                  {song.tags && song.tags.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate">
                        {song.tags.slice(0, 2).join(" / ")}
                      </span>
                    </>
                  )}
                  {alreadyQueued && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="text-accent-amber">in queue</span>
                    </>
                  )}
                </div>
              </div>
              <LangChip lang={song.language} />
              <span
                aria-hidden
                className="-mr-1 hidden text-ink-muted transition-colors group-hover:text-accent group-disabled:opacity-0 sm:inline"
              >
                ›
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LangChip({ lang }: { lang: Song["language"] }) {
  return (
    <span className="shrink-0 rounded-md border border-bg-border bg-bg-raised px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-ink-secondary">
      {LANG_LABEL[lang]}
    </span>
  );
}

// ── Confirm bottom-sheet / modal ────────────────────────────────────────

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg-base/75 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="ktv-fade-in w-full max-w-md rounded-t-3xl border border-bg-border bg-bg-panel p-6 pb-8 sm:rounded-3xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle for mobile bottom sheet */}
        <div
          aria-hidden
          className="mx-auto mb-5 h-1 w-10 rounded-full bg-bg-border sm:hidden"
        />

        {!submitted ? (
          <>
            <header>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                add to queue?
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                {song.title}
              </h2>
              <p className="mt-1 font-mono text-sm text-ink-secondary">
                {song.artist}
              </p>
            </header>

            {submit.kind === "rate_limit" && (
              <FeedbackLine
                tone="warn"
                text="Just sent one — give it 30 seconds and try again."
              />
            )}
            {submit.kind === "duplicate" && (
              <FeedbackLine
                tone="warn"
                text={`Already in queue — currently #${submit.position}.`}
              />
            )}
            {submit.kind === "not_accepting" && (
              <FeedbackLine
                tone="warn"
                text="Queue just closed. Catch the performer next set."
              />
            )}
            {submit.kind === "error" && (
              <FeedbackLine tone="error" text={submit.message} />
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-bg-border bg-bg-raised py-4 font-mono text-sm text-ink-secondary transition-colors hover:text-ink-primary active:scale-[0.99]"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={submit.kind === "submitting"}
                className="flex-[2] rounded-xl border border-accent bg-accent/15 py-4 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/25 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
              >
                {submit.kind === "submitting" ? "sending…" : "confirm →"}
              </button>
            </div>
          </>
        ) : (
          <div className="py-2 text-center">
            <div
              aria-hidden
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent-green/40 bg-accent-green/10 font-mono text-3xl text-accent-green"
            >
              ✓
            </div>
            <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight">
              Added.
            </h2>
            <p className="mt-2 text-[15px] text-ink-secondary">
              <span className="text-ink-primary">{song.title}</span> is{" "}
              <span className="font-mono text-accent">
                #{submit.position}
              </span>{" "}
              in line.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-xl border border-bg-border bg-bg-raised py-4 font-mono text-sm text-ink-primary transition-colors hover:bg-bg-panel active:scale-[0.99]"
            >
              pick another →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackLine({
  tone,
  text,
}: {
  tone: "warn" | "error";
  text: string;
}) {
  const colors =
    tone === "warn"
      ? "border-accent-amber/40 bg-accent-amber/10 text-accent-amber"
      : "border-accent-red/40 bg-accent-red/10 text-accent-red";
  return (
    <p
      className={`mt-5 rounded-lg border px-3.5 py-2.5 text-[13px] ${colors}`}
    >
      {text}
    </p>
  );
}

// ── Boundary states ─────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-12 sm:max-w-lg sm:px-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
          street ktv
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
          loading
        </span>
      </div>
      <div className="mt-7 h-12 w-2/3 animate-pulse rounded-md bg-bg-panel" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded-md bg-bg-panel" />
      <div className="mt-7 h-24 animate-pulse rounded-2xl bg-bg-panel" />
      <div className="mt-3 h-12 animate-pulse rounded-xl bg-bg-panel" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[60px] animate-pulse rounded-xl bg-bg-panel"
          />
        ))}
      </div>
    </main>
  );
}

function ServiceUnavailableScreen() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-amber">
        street ktv
      </p>
      <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight">
        Warming up.
      </h1>
      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-secondary">
        The performer hasn’t connected the queue yet. Try again in a moment.
      </p>
    </main>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-red">
        something went wrong
      </p>
      <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight">
        Couldn’t load.
      </h1>
      <p className="mt-3 max-w-xs font-mono text-xs text-ink-muted">
        {message}
      </p>
    </main>
  );
}
