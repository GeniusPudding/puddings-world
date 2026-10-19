import { test } from "node:test";
import assert from "node:assert/strict";
import { imagesFirst } from "../lib/now";

test("items with an image move ahead, keeping their relative order", () => {
  const items = [
    { title: "a" },
    { title: "b", image: "/b.png" },
    { title: "c" },
    { title: "d", image: "/d.png" },
  ];
  assert.deepEqual(
    imagesFirst(items).map((i) => i.title),
    ["b", "d", "a", "c"],
  );
});

test("the input array is not mutated", () => {
  const items = [{ title: "a" }, { title: "b", image: "/b.png" }];
  imagesFirst(items);
  assert.deepEqual(items.map((i) => i.title), ["a", "b"]);
});
