import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AdminLogin } from "@/components/AdminLogin";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";
import { type DayStats, lastDays, type Ranked, statsKeys, summarize } from "@/lib/analytics";
import type { ContactMessage } from "@/lib/contact";
import { EVENT_LOG_KEY, type LoggedEvent, parseStored } from "@/lib/event-log";
import { getRedis } from "@/lib/ktv/kv";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "admin",
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;
type StoredMessage = ContactMessage & { receivedAt: string };

async function loadDays(days: string[]): Promise<DayStats[]> {
  const redis = getRedis();
  if (!redis) return [];
  return Promise.all(
    days.map(async (day) => {
      const k = statsKeys(day);
      const [views, visitors, sources, countries] = await Promise.all([
        redis.hgetall<Record<string, number>>(k.views),
        redis.pfcount(k.visitors),
        redis.hgetall<Record<string, number>>(k.sources),
        redis.hgetall<Record<string, number>>(k.countries),
      ]);
      return {
        day,
        views: views ?? {},
        visitors,
        sources: sources ?? {},
        countries: countries ?? {},
      };
    }),
  );
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySession(session, process.env.ADMIN_PASSWORD, new Date())) {
    return (
      <main className="px-4">
        <AdminLogin />
      </main>
    );
  }

  const requested = Number((await searchParams).days);
  const range = RANGES.find((r) => r === requested) ?? 30;
  const redis = getRedis();
  const [stats, messages, events] = await Promise.all([
    loadDays(lastDays(range, new Date())).then(summarize),
    redis
      ? redis.lrange("contact:messages", 0, 49).then((e) => parseStored<StoredMessage>(e))
      : [],
    redis ? redis.lrange(EVENT_LOG_KEY, 0, 99).then((e) => parseStored<LoggedEvent>(e)) : [],
  ]);
  const peak = Math.max(1, ...stats.series.map((d) => d.views));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-lg text-ink-primary">admin</h1>
        <div className="flex items-center gap-2 font-mono text-xs">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin?days=${r}`}
              className={`rounded border px-2 py-1 ${
                r === range
                  ? "border-accent/50 text-accent"
                  : "border-bg-border text-ink-muted hover:text-ink-primary"
              }`}
            >
              {r}d
            </Link>
          ))}
          <form action="/api/admin/logout" method="post">
            <button className="ml-2 rounded border border-bg-border px-2 py-1 text-ink-muted hover:text-ink-primary">
              sign out
            </button>
          </form>
        </div>
      </header>

      {!redis && (
        <p className="mt-6 text-sm text-accent-red">Redis isn&apos;t configured; nothing is recorded.</p>
      )}

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={`views · ${range}d`} value={stats.totalViews} />
        <Stat label="daily visitors (sum)" value={stats.totalVisitors} />
        <Stat label="today" value={stats.series.at(-1)?.views ?? 0} />
        <Stat label="messages" value={messages.length} />
      </section>

      <section className="mt-8 rounded-lg border border-bg-border bg-bg-panel p-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">Views per day</h2>
        <div className="mt-4 flex h-32 items-end gap-px">
          {stats.series.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.views} views, ${d.visitors} visitors`}
              className="min-w-0 flex-1 rounded-t-sm bg-accent/60 hover:bg-accent"
              style={{ height: `${(d.views / peak) * 100}%`, minHeight: d.views ? 2 : 0 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-muted">
          <span>{stats.series[0]?.day}</span>
          <span>{stats.series.at(-1)?.day}</span>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <RankList title="Pages" rows={stats.pages} />
        <RankList title="Sources" rows={stats.sources} empty="No outside referrers yet." />
        <RankList title="Countries" rows={stats.countries} />
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">Messages</h2>
        {messages.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No messages yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {messages.map((m, i) => (
              <li key={i} className="rounded-lg border border-bg-border bg-bg-panel p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0 break-all text-ink-primary">
                    {m.name}
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="ml-2 text-accent hover:underline">
                        {m.email}
                      </a>
                    )}
                  </span>
                  <span className="font-mono text-ink-muted">{fmt(m.receivedAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-secondary">
                  {m.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">Activity log</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nothing logged yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-bg-border rounded-lg border border-bg-border bg-bg-panel font-mono text-xs">
            {events.map((e, i) => (
              <li key={i} className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:gap-4">
                <span className="shrink-0 text-ink-muted">{fmt(e.at)}</span>
                <span className="shrink-0 text-accent">{e.type}</span>
                <span className="min-w-0 break-all text-ink-secondary">{e.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-primary">{value.toLocaleString()}</p>
    </div>
  );
}

function RankList({ title, rows, empty }: { title: string; rows: Ranked; empty?: string }) {
  const top = rows.slice(0, 12);
  return (
    <div className="min-w-0 rounded-lg border border-bg-border bg-bg-panel p-4">
      <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">{title}</h2>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{empty ?? "No data yet."}</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {top.map((r) => (
            <li key={r.key} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-ink-secondary" title={r.key}>
                {r.key}
              </span>
              <span className="shrink-0 font-mono text-ink-primary">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
