export const SITE_HOST = "puddings-world.com";
/** Days of raw stats kept in Redis. */
export const STATS_TTL_SEC = 400 * 24 * 60 * 60;
const MAX_PATH_LEN = 120;
const MAX_SOURCE_LEN = 40;
const UNTRACKED_PREFIXES = ["/api", "/admin", "/_next"];
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python-requests|httpclient/i;

export const statsKeys = (day: string) => ({
  views: `stats:${day}:views`,
  visitors: `stats:${day}:uv`,
  sources: `stats:${day}:refs`,
  countries: `stats:${day}:countries`,
});

/** Strips query and hash; returns null for paths that aren't site pages. */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  let path = raw.split(/[?#]/)[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (path.length > MAX_PATH_LEN) return null;
  if (UNTRACKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return path;
}

/**
 * Where a visit came from: `utm_source` when present, otherwise the
 * referrer's host without `www.`. Internal navigation and missing referrers
 * return null.
 */
export function trafficSource(
  referrer: unknown,
  utmSource: unknown,
  siteHost: string = SITE_HOST,
): string | null {
  if (typeof utmSource === "string") {
    const utm = utmSource.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (utm) return utm.slice(0, MAX_SOURCE_LEN);
  }
  if (typeof referrer !== "string" || !referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  if (!host || host === siteHost || host.endsWith(`.${siteHost}`)) return null;
  if (host === "localhost" || host.endsWith(".vercel.app")) return null;
  return host.slice(0, MAX_SOURCE_LEN);
}

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

/** Calendar day in Taipei, `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The last `n` day keys, oldest first, ending today. */
export function lastDays(n: number, now: Date): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  return days;
}

export type DayStats = {
  day: string;
  views: Record<string, number>;
  visitors: number;
  sources: Record<string, number>;
  countries: Record<string, number>;
};

export type Ranked = { key: string; count: number }[];

export type StatsSummary = {
  series: { day: string; views: number; visitors: number }[];
  totalViews: number;
  /** Sum of daily uniques: a visitor on two days counts twice. */
  totalVisitors: number;
  pages: Ranked;
  sources: Ranked;
  countries: Ranked;
};

function rank(maps: Record<string, number>[]): Ranked {
  const merged = new Map<string, number>();
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) merged.set(k, (merged.get(k) ?? 0) + Number(v));
  }
  return [...merged]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function summarize(days: DayStats[]): StatsSummary {
  const series = days.map((d) => ({
    day: d.day,
    views: Object.values(d.views).reduce((s, v) => s + Number(v), 0),
    visitors: d.visitors,
  }));
  return {
    series,
    totalViews: series.reduce((s, d) => s + d.views, 0),
    totalVisitors: series.reduce((s, d) => s + d.visitors, 0),
    pages: rank(days.map((d) => d.views)),
    sources: rank(days.map((d) => d.sources)),
    countries: rank(days.map((d) => d.countries)),
  };
}
