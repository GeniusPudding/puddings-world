import { test } from "node:test";
import assert from "node:assert/strict";
import { withLocalImages } from "../lib/projects";
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
