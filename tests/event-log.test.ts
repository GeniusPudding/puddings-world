import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStored } from "../lib/event-log";

test("stored list entries parse from strings or pass through as objects", () => {
  assert.deepEqual(parseStored([{ a: 1 }, '{"a":2}', "not json", 7, null]), [{ a: 1 }, { a: 2 }]);
});
