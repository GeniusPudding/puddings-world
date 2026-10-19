import { test } from "node:test";
import assert from "node:assert/strict";
import { docsToMusings, hookOf, stanzasOf } from "../lib/musings";

test("a song's cover shows the line it repeats most, with the line after", () => {
  const body = "open one\nopen two\n\nhook here\nand then\n\nverse\n\nhook  here\nand then\nmore";
  assert.equal(hookOf(body), "hook here\nand then");
});

test("a song that never repeats shows its opening lines", () => {
  assert.equal(hookOf("first  line\nsecond\nthird\n\nfourth"), "first  line\nsecond");
});

test("stanzas sung more than once are flagged, whatever their line breaks", () => {
  assert.deepEqual(stanzasOf("a b\nc\n\nverse\n\na b c\n\n\nend"), [
    { text: "a b\nc", repeated: true },
    { text: "verse", repeated: false },
    { text: "a b c", repeated: true },
    { text: "end", repeated: false },
  ]);
});

test("docs become lyrics musings with stable slugs, sayings pass through", () => {
  const { musings, sayings } = docsToMusings([
    { id: "1AbCdEfGhIjKlMnOp", kind: "lyrics", pieces: [{ title: "A", body: "la" }, { body: "lo", date: "2020" }], sayings: [] },
    { id: "2xx", kind: "sayings", pieces: [], sayings: [{ text: "hi" }] },
  ]);
  assert.deepEqual(musings, [
    { slug: "1AbCdEfGhIjK-1", type: "lyrics", title: "A", body: "la", hook: "la" },
    { slug: "1AbCdEfGhIjK-2", type: "lyrics", date: "2020", body: "lo", hook: "lo" },
  ]);
  assert.deepEqual(sayings, [{ text: "hi" }]);
});

test("a cover line in the doc wins over the picked hook", () => {
  const { musings } = docsToMusings([
    { id: "1AbCdEfGhIjKlMnOp", kind: "lyrics", pieces: [{ title: "A", body: "la\nla", hook: "chosen" }], sayings: [] },
  ]);
  assert.equal(musings[0].hook, "chosen");
});
