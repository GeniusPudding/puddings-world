import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordMatches, signSession, verifySession } from "../lib/admin-auth";

const now = new Date("2026-10-19T00:00:00Z");

test("a fresh session verifies with the same secret", () => {
  assert.equal(verifySession(signSession("s3cret", now), "s3cret", now), true);
});

test("changing the password invalidates sessions", () => {
  assert.equal(verifySession(signSession("old", now), "new", now), false);
});

test("expired, tampered and missing sessions are rejected", () => {
  const token = signSession("s3cret", now, 60);
  assert.equal(verifySession(token, "s3cret", new Date(now.getTime() + 61_000)), false);
  const [exp, mac] = token.split(".");
  assert.equal(verifySession(`${Number(exp) + 9999}.${mac}`, "s3cret", now), false);
  assert.equal(verifySession(undefined, "s3cret", now), false);
  assert.equal(verifySession("garbage", "s3cret", now), false);
  assert.equal(verifySession(token, undefined, now), false);
});

test("password check needs a configured, matching password", () => {
  assert.equal(passwordMatches("pw", "pw"), true);
  assert.equal(passwordMatches("pw ", "pw"), false);
  assert.equal(passwordMatches("", ""), false);
  assert.equal(passwordMatches("pw", undefined), false);
  assert.equal(passwordMatches(123, "123"), false);
});
