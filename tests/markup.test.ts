import { test } from "node:test";
import assert from "node:assert/strict";
import { hueFor, initials, splitBold } from "../lib/markup";

test("plain text is a single non-bold segment", () => {
  assert.deepEqual(splitBold("hello world"), [{ text: "hello world", bold: false }]);
});

test("bold runs are split out in order", () => {
  assert.deepEqual(splitBold("a **b** c **d**"), [
    { text: "a ", bold: false },
    { text: "b", bold: true },
    { text: " c ", bold: false },
    { text: "d", bold: true },
  ]);
});

test("bold at the start and end needs no surrounding text", () => {
  assert.deepEqual(splitBold("**x**"), [{ text: "x", bold: true }]);
});

test("an unclosed marker is kept literally", () => {
  assert.deepEqual(splitBold("a **b c"), [{ text: "a **b c", bold: false }]);
});

test("empty bold markers are dropped", () => {
  assert.deepEqual(splitBold("a ****b"), [
    { text: "a ", bold: false },
    { text: "b", bold: false },
  ]);
});

test("empty input yields no segments", () => {
  assert.deepEqual(splitBold(""), []);
});

test("hue is stable and in range", () => {
  assert.equal(hueFor("Mapetite"), hueFor("Mapetite"));
  for (const s of ["a", "paper-daily", "This site", "中文"]) {
    const h = hueFor(s);
    assert.ok(h >= 0 && h < 360, `${s} → ${h}`);
  }
});

test("initials take the first letter of up to two words", () => {
  assert.equal(initials("paper-daily"), "PD");
  assert.equal(initials("This site"), "TS");
  assert.equal(initials("Mapetite"), "M");
  assert.equal(initials("Virtual Embryo Challenge"), "VE");
  assert.equal(initials(""), "?");
});
