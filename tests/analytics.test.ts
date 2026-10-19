import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey, isBot, lastDays, normalizePath, summarize, trafficSource } from "../lib/analytics";

test("page paths drop query, hash and trailing slash", () => {
  assert.equal(normalizePath("/projects/?x=1#top"), "/projects");
  assert.equal(normalizePath("/"), "/");
  assert.equal(normalizePath("/musings/%E6%AD%8C"), "/musings/歌");
});

test("api, admin, framework and malformed paths are not counted", () => {
  for (const p of ["/api/track", "/admin", "/admin/assistant", "/_next/x", "//evil.com", "x", 42, "/%E0"]) {
    assert.equal(normalizePath(p), null, String(p));
  }
  assert.equal(normalizePath("/administrator"), "/administrator");
  assert.equal(normalizePath(`/${"a".repeat(200)}`), null);
});

test("traffic source is the referrer host, utm_source wins", () => {
  assert.equal(trafficSource("https://www.google.com/search?q=x", null), "google.com");
  assert.equal(trafficSource("https://t.co/abc", " Threads "), "threads");
  assert.equal(trafficSource("https://github.com/puddings-world", ""), "github.com");
});

test("internal, preview and missing referrers have no source", () => {
  assert.equal(trafficSource("https://puddings-world.com/projects", null), null);
  assert.equal(trafficSource("https://www.puddings-world.com/", null), null);
  assert.equal(trafficSource("https://x-git-main.vercel.app/", null), null);
  assert.equal(trafficSource("", null), null);
  assert.equal(trafficSource("not a url", undefined), null);
});

test("crawlers and requests without a user agent count as bots", () => {
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot(null), true);
  assert.equal(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1"), false);
});

test("days roll over at midnight Taipei time", () => {
  assert.equal(dayKey(new Date("2026-10-18T15:59:00Z")), "2026-10-18");
  assert.equal(dayKey(new Date("2026-10-18T16:00:00Z")), "2026-10-19");
  assert.deepEqual(lastDays(3, new Date("2026-10-19T00:00:00Z")), [
    "2026-10-17",
    "2026-10-18",
    "2026-10-19",
  ]);
});

test("summary totals days and ranks pages, sources and countries", () => {
  const s = summarize([
    { day: "a", views: { "/": 3, "/projects": 1 }, visitors: 2, sources: { "google.com": 1 }, countries: { TW: 3 } },
    { day: "b", views: { "/projects": 4 }, visitors: 1, sources: {}, countries: { TW: 1, JP: 3 } },
  ]);
  assert.deepEqual(s.series, [
    { day: "a", views: 4, visitors: 2 },
    { day: "b", views: 4, visitors: 1 },
  ]);
  assert.equal(s.totalViews, 8);
  assert.equal(s.totalVisitors, 3);
  assert.deepEqual(s.pages, [
    { key: "/projects", count: 5 },
    { key: "/", count: 3 },
  ]);
  assert.deepEqual(s.countries, [
    { key: "TW", count: 4 },
    { key: "JP", count: 3 },
  ]);
});
