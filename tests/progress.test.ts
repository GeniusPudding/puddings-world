import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeProgress, progressSummary } from "../lib/progress";

test("well-formed milestones pass through, trimmed", () => {
  assert.deepEqual(
    normalizeProgress([
      { title: " MVP ", status: "done", note: " shipped to friends " },
      { title: "Beta", status: "doing" },
    ]),
    [
      { title: "MVP", status: "done", note: "shipped to friends" },
      { title: "Beta", status: "doing" },
    ],
  );
});

test("malformed milestones are dropped, not fatal", () => {
  assert.deepEqual(
    normalizeProgress([null, "x", { title: "", status: "done" }, { title: "A", status: "maybe" }, { title: "B", status: "next", note: 3 }]),
    [{ title: "B", status: "next" }],
  );
  assert.equal(normalizeProgress([{ title: "A", status: "wip" }]), undefined);
  assert.equal(normalizeProgress("done"), undefined);
  assert.equal(normalizeProgress(undefined), undefined);
});

test("summary counts finished milestones", () => {
  assert.deepEqual(
    progressSummary([
      { title: "a", status: "done" },
      { title: "b", status: "doing" },
      { title: "c", status: "next" },
    ]),
    { done: 1, total: 3 },
  );
});
