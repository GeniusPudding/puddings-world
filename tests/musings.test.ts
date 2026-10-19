import { test } from "node:test";
import assert from "node:assert/strict";
import { docsToMusings, excerptOf } from "../lib/musings";

test("short songs need no excerpt", () => {
  assert.equal(excerptOf("a\nb\nc"), undefined);
});

test("long songs are cut at a stanza break near the limit", () => {
  const body = [...Array(10).fill("x"), "", ...Array(10).fill("y")].join("\n");
  assert.equal(excerptOf(body), Array(10).fill("x").join("\n"));
});

test("docs become lyrics musings with stable slugs, sayings pass through", () => {
  const { musings, sayings } = docsToMusings([
    { id: "1AbCdEfGhIjKlMnOp", kind: "lyrics", pieces: [{ title: "A", body: "la" }, { body: "lo", date: "2020" }], sayings: [] },
    { id: "2xx", kind: "sayings", pieces: [], sayings: [{ text: "hi" }] },
  ]);
  assert.deepEqual(musings, [
    { slug: "1AbCdEfGhIjK-1", type: "lyrics", title: "A", body: "la" },
    { slug: "1AbCdEfGhIjK-2", type: "lyrics", date: "2020", body: "lo" },
  ]);
  assert.deepEqual(sayings, [{ text: "hi" }]);
});
