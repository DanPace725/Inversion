import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const base = process.env.INVERSION_TEST_URL || "http://127.0.0.1:4173";
const login = await fetch(`${base}/signin-with-chatgpt?return_to=/`, { redirect: "manual" });
const cookie = login.headers.getSetCookie().map(x => x.split(";")[0]).join("; ");
assert.ok(cookie, "Local development sign-in must provide a cookie");
const headers = { cookie, Origin: base };
async function call(path, method = "GET", body) {
  const result = await fetch(`${base}/api/${path}`, { method, headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const value = await result.json();
  return { status: result.status, value };
}
const anonymous = await fetch(`${base}/api/state?session=peace`, { redirect: "manual" });
assert.equal(anonymous.status, 401);
const crossSite = await fetch(`${base}/api/import`, { method: "POST", headers: { ...headers, Origin: "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" });
assert.equal(crossSite.status, 403);
const id = randomUUID(), other = randomUUID();
assert.equal((await call("import", "POST", { session: "peace", responses: [{ id: other, text: "PRIVATE: this must stay off the screen", permission: false }] })).status, 200);
const photo = await readFile(new URL("../tests/fixtures/reflection.png", import.meta.url));
async function upload(buffer = photo) {
  const form = new FormData(); form.set("id", id); form.set("session", "peace"); form.set("medium", "pen"); form.set("photo", new Blob([buffer], { type: "image/png" }), "reflection.png");
  const result = await fetch(`${base}/api/upload`, { method: "POST", headers, body: form });
  return { status: result.status, value: await result.json() };
}
assert.equal((await upload()).status, 200); assert.equal((await upload()).status, 200);
let state = (await call("state?session=peace")).value;
assert.equal(state.responses.filter(x => x.id === id).length, 1);
console.log("PASS private access, origin checks, upload acknowledgement, idempotent retry");
assert.equal((await call("process", "POST", {})).status, 200);
state = (await call("state?session=peace")).value;
let row = state.responses.find(x => x.id === id);
assert.equal(row.status, "review", row.error);
assert.match(row.text.toLowerCase(), /outdoors/); assert.match(row.text.toLowerCase(), /notifications/);
assert.equal(row.verified, 0); assert.equal(row.approved, 0);
console.log("PASS real image upload → OpenAI transcription → unverified review queue (synthetic handwriting)");
assert.equal((await call(`responses/${id}`, "PATCH", { version: row.version, text: row.text, excerpt: row.text, verified: false, permission: true, approved: true })).status, 400);
assert.equal((await call(`responses/${id}`, "PATCH", { version: row.version, text: row.text, excerpt: row.text, verified: true, permission: true, approved: true })).status, 200);
state = (await call("state?session=peace")).value; row = state.responses.find(x => x.id === id);
assert.equal(row.approved, 0, "Changed text/excerpt must be saved before separate approval");
assert.equal((await call(`responses/${id}`, "PATCH", { version: row.version, text: row.text, excerpt: row.text, verified: true, permission: true, approved: true })).status, 200);
const suggestion = await call("suggest", "POST", { session: "peace" });
assert.equal(suggestion.status, 200, suggestion.value.error);
assert.ok(suggestion.value.groups.length > 0);
const groupSave = await call("groups", "PUT", { session: "peace", groups: suggestion.value.groups, version: state.groupVersion });
assert.equal(groupSave.status, 200, groupSave.value.error);
assert.equal((await call("freeze", "POST", { session: "peace" })).status, 200);
const projection = await call("presentation?session=peace");
assert.equal(projection.status, 200); assert.equal(projection.value.quotes.length, 1);
assert.ok(!JSON.stringify(projection.value).includes("PRIVATE:")); assert.ok(!JSON.stringify(projection.value).includes("image_key"));
console.log("PASS separate approval, AI theme suggestions, saved groups, frozen projector payload excludes private material");
state = (await call("state?session=peace")).value; row = state.responses.find(x => x.id === id);
assert.equal((await call(`responses/${id}`, "PATCH", { version: row.version - 1, text: "stale" })).status, 409);
assert.equal((await call(`responses/${id}`, "PATCH", { version: row.version, text: row.text, excerpt: row.excerpt, verified: true, permission: false, approved: false })).status, 200);
assert.equal((await call("presentation?session=peace")).status, 404);
console.log("PASS stale-edit protection and approval withdrawal invalidates presentation");
if (process.env.INVERSION_KEEP_TEST_DATA !== "1") {
  assert.equal((await call(`responses/${id}`, "DELETE", {})).status, 200);
  assert.equal((await call(`responses/${other}`, "DELETE", {})).status, 200);
  assert.equal((await call(`image/${id}`)).status, 404);
  console.log("PASS test cleanup removes images and records");
}
