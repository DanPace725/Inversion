import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanThemes, makePresentation, SESSIONS, type Reflection } from "../lib/domain.ts";
function answer(id: string, patch: Partial<Reflection> = {}): Reflection {
  return { id, session: "peace", medium: "pen", status: "review", draft: "PRIVATE DRAFT", text: "Verified words", warnings: "[]", verified: 0, permission: 0, approved: 0, excerpt: "An approved excerpt", error: "", created: 1, updated: 1, version: 1, has_image: true, ...patch };
}
test("only verified, permitted and approved excerpts enter the presentation", () => {
  const rows = [answer("safe", { verified: 1, permission: 1, approved: 1 }), answer("unverified", { permission: 1, approved: 1 }), answer("no-permission", { verified: 1, approved: 1 }), answer("unapproved", { verified: 1, permission: 1 })];
  const display = makePresentation(SESSIONS[0], rows, []);
  assert.equal(display.quotes.length, 1); assert.equal(display.reviewed, 3);
  assert.equal(display.quotes[0].text, "An approved excerpt");
  assert.ok(!JSON.stringify(display).includes("PRIVATE DRAFT"));
  assert.ok(!JSON.stringify(display).includes("has_image"));
});
test("theme membership rejects unverified and unknown IDs", () => {
  assert.throws(() => cleanThemes([{ title: "Connection", responseIds: ["unverified"] }], [answer("unverified")]), /verified/);
  assert.throws(() => cleanThemes([{ title: "Connection", responseIds: ["another-session"] }], [answer("safe", { verified: 1 })]), /verified/);
});
test("duplicate IDs within a theme do not inflate counts", () => {
  const rows = [answer("a", { verified: 1 })], themes = cleanThemes([{ title: "Rest", responseIds: ["a", "a"] }], rows);
  assert.deepEqual(themes[0].responseIds, ["a"]); assert.equal(makePresentation(SESSIONS[0], rows, themes).groups[0].count, 1);
});
test("overlapping themes preserve their actual counts and denominator", () => {
  const rows = [answer("a", { verified: 1 }), answer("b", { verified: 1 })];
  const themes = cleanThemes([{ title: "Rest", responseIds: ["a", "b"] }, { title: "People", responseIds: ["a"] }], rows);
  const display = makePresentation(SESSIONS[0], rows, themes);
  assert.deepEqual(display.groups.map(g => g.count), [2, 1]); assert.equal(display.reviewed, 2);
});
test("theme identifiers are unique and blank titles are rejected", () => {
  assert.throws(() => cleanThemes([{ id: "same", title: "A", responseIds: [] }, { id: "same", title: "B", responseIds: [] }], []), /unique/);
  assert.throws(() => cleanThemes([{ title: "  ", responseIds: [] }], []), /title/);
});
test("empty excerpts cannot appear even if approval flags are stale", () => {
  const display = makePresentation(SESSIONS[0], [answer("a", { verified: 1, permission: 1, approved: 1, excerpt: "   " })], []);
  assert.equal(display.quotes.length, 0);
});
