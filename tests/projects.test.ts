import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPins, sortProjects, spotlight, withLocalImages } from "../lib/projects";
import type { Project } from "../lib/types";

const base = (slug: string, image?: string): Project => ({
  slug,
  title: slug,
  tagline: "",
  track: "tool",
  status: "active",
  repo: { owner: "o", name: slug, private: false },
  topics: [],
  links: [],
  featured: false,
  image,
});

test("a local screenshot fills a project without an image", () => {
  const [p] = withLocalImages([base("paperfact")], (path) => path === "/projects/paperfact.jpg");
  assert.equal(p.image, "/projects/paperfact.jpg");
});

test("extension preference is jpg, then png, then webp", () => {
  const files = new Set(["/projects/x.png", "/projects/x.webp"]);
  const [p] = withLocalImages([base("x")], (path) => files.has(path));
  assert.equal(p.image, "/projects/x.png");
});

test("a manifest image wins over a local file", () => {
  const [p] = withLocalImages([base("y", "https://example.com/y.png")], () => true);
  assert.equal(p.image, "https://example.com/y.png");
});

test("no local file leaves the project untouched", () => {
  const input = base("z");
  const [p] = withLocalImages([input], () => false);
  assert.equal(p.image, undefined);
  assert.equal(p, input);
});

test("featured projects sort ahead of more recent ones, after explicit order", () => {
  const at = (slug: string, pushedAt: string, extra: Partial<Project> = {}): Project => ({
    ...base(slug),
    ...extra,
    activity: { stars: 0, openIssues: 0, defaultBranch: "main", pushedAt, weeklyCommits: 0 },
  });
  const sorted = sortProjects([
    at("recent", "2026-10-01"),
    at("flagged", "2025-01-01", { featured: true }),
    at("pinned", "2024-01-01", { order: 1 }),
  ]);
  assert.deepEqual(sorted.map((p) => p.slug), ["pinned", "flagged", "recent"]);
});

const pushed = (slug: string, pushedAt: string, extra: Partial<Project> = {}): Project => ({
  ...base(slug),
  ...extra,
  activity: { stars: 0, openIssues: 0, defaultBranch: "main", pushedAt, weeklyCommits: 0 },
});

test("GitHub pins sort ahead of featured and recent, behind explicit order", () => {
  const sorted = sortProjects([
    pushed("recent", "2026-10-01"),
    pushed("flagged", "2025-01-01", { featured: true }),
    pushed("pin1", "2024-01-01", { pinned: 1 }),
    pushed("pin0", "2023-01-01", { pinned: 0 }),
    pushed("ordered", "2022-01-01", { order: 1 }),
  ]);
  assert.deepEqual(sorted.map((p) => p.slug), ["ordered", "pin0", "pin1", "flagged", "recent"]);
});

test("pins match repos case-insensitively and stale pins are cleared", () => {
  const out = applyPins(
    [base("a"), { ...base("b"), pinned: 4 }, base("c")],
    ["o/C", "someone/else", "o/a"],
  );
  assert.deepEqual(out.map((p) => p.pinned), [2, undefined, 0]);
  assert.equal("pinned" in out[1], false);
});

test("the spotlight row shows pins in order, then the latest few pushed within a month", () => {
  const now = Date.parse("2026-10-23T00:00:00Z");
  const row = spotlight(
    [
      pushed("old", "2026-08-01"),
      pushed("pinB", "2025-01-01", { pinned: 3 }),
      pushed("r1", "2026-10-22"),
      pushed("r2", "2026-10-20"),
      pushed("r3", "2026-10-10"),
      pushed("r4", "2026-10-01"),
      pushed("pinA", "2024-01-01", { pinned: 0 }),
    ],
    now,
  );
  assert.deepEqual(row.map((p) => p.slug), ["pinA", "pinB", "r1", "r2", "r3"]);
});
