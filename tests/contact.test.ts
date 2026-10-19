import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_MESSAGE_LEN, parseContact, renderEmail } from "../lib/contact";

test("a message with name and email is accepted and trimmed", () => {
  assert.deepEqual(parseContact({ name: " Ann ", email: "a@b.co", message: " hi \n" }), {
    ok: true,
    value: { name: "Ann", email: "a@b.co", message: "hi" },
  });
});

test("name and email are optional", () => {
  assert.deepEqual(parseContact({ message: "hello" }), {
    ok: true,
    value: { name: "Anonymous", message: "hello" },
  });
});

test("an empty or whitespace-only message is rejected", () => {
  assert.equal(parseContact({ message: "  ​ " }).ok, false);
});

test("an overlong message is rejected, the limit itself is fine", () => {
  assert.equal(parseContact({ message: "x".repeat(MAX_MESSAGE_LEN + 1) }).ok, false);
  assert.equal(parseContact({ message: "x".repeat(MAX_MESSAGE_LEN) }).ok, true);
});

test("a malformed email is rejected", () => {
  assert.equal(parseContact({ email: "not-an-email", message: "hi" }).ok, false);
});

test("a filled honeypot is reported as spam, not as an error", () => {
  assert.deepEqual(parseContact({ website: "http://spam", message: "buy" }), {
    ok: true,
    spam: true,
  });
});

test("non-object bodies are rejected", () => {
  assert.equal(parseContact(null).ok, false);
  assert.equal(parseContact("hi").ok, false);
});

test("line breaks in the message survive cleaning", () => {
  const r = parseContact({ message: "line one\nline two" });
  assert.ok(r.ok && "value" in r && r.value.message === "line one\nline two");
});

test("the email subject previews the first line and carries the sender", () => {
  const { subject, text } = renderEmail(
    { name: "Ann", email: "a@b.co", message: "first line\nsecond" },
    new Date("2026-10-19T00:00:00Z"),
  );
  assert.equal(subject, "[puddingsworld] Ann: first line");
  assert.match(text, /From: Ann <a@b\.co>/);
  assert.match(text, /first line\nsecond$/);
});
