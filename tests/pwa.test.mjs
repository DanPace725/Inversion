import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import vm from "node:vm";

const script = await fs.readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const offlineHtml = await fs.readFile(new URL("../public/offline.html", import.meta.url), "utf8");
const origin = "https://inversion.example";
function response(path, body = "generic public asset", type = "text/html", patch = {}) {
  const result = new Response(body, { headers: { "Content-Type": type } });
  Object.defineProperty(result, "url", { value: origin + path });
  Object.defineProperty(result, "redirected", { value: false, configurable: true });
  for (const [key, value] of Object.entries(patch)) Object.defineProperty(result, key, { value, configurable: true });
  return result;
}
function worker() {
  const listeners = new Map(), stores = new Map(), deleted = [];
  let skipWaiting = 0, claims = 0, offline = false, authRedirect = false, cleanRedirect = false, fakeOffline = false;
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { put: async (key, value) => store.set(key, value.clone()), match: async key => store.get(key)?.clone() };
    },
    keys: async () => [...stores.keys()], delete: async name => { deleted.push(name); return stores.delete(name); },
  };
  const fetch = async request => {
    if (offline) throw new Error("Disconnected");
    const path = typeof request === "string" ? request : new URL(request.url).pathname;
    if (authRedirect) return response("/signin-with-chatgpt", "ACCOUNT LOGIN PAGE", "text/html", { redirected: true });
    if (path === "/offline.html" && cleanRedirect) return response("/offline", fakeOffline ? "ACCOUNT LOGIN PAGE" : offlineHtml, "text/html", { redirected: true });
    return response(path, path === "/offline.html" ? offlineHtml : path === "/" ? "PRIVATE RESPONSE DATA" : "generic public asset", path.endsWith(".png") ? "image/png" : path.endsWith(".css") ? "text/css" : "text/html");
  };
  const self = { location: { origin }, addEventListener: (name, listener) => listeners.set(name, listener), clients: { claim: async () => claims++ }, skipWaiting: async () => skipWaiting++ };
  vm.runInNewContext(script, { self, caches, fetch, URL, Response, Map });
  return {
    stores, deleted, offline: value => offline = value, authRedirect: value => authRedirect = value,
    stats: () => ({ skipWaiting, claims }),
    cleanRedirect: value => cleanRedirect = value, fakeOffline: value => fakeOffline = value,
    event: async (type, data = {}) => { let work; listeners.get(type)({ ...data, waitUntil: promise => work = promise }); await work; },
    request: async (path, options = {}) => {
      let result;
      listeners.get("fetch")({ request: { url: origin + path, method: "GET", mode: "cors", ...options }, respondWith: promise => result = promise });
      return result ? { intercepted: true, response: await result } : { intercepted: false };
    },
  };
}
test("manifest provides standalone launch, capture shortcut, and required icons", async () => {
  const manifest = JSON.parse(await fs.readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.display, "standalone"); assert.equal(manifest.scope, "/"); assert.equal(manifest.id, "/");
  assert.deepEqual(manifest.icons.filter(x => x.purpose === "any").map(x => x.sizes), ["192x192", "512x512"]);
  assert.ok(manifest.icons.some(x => x.purpose === "maskable")); assert.match(manifest.shortcuts[0].url, /capture=1/);
  for (const icon of manifest.icons) {
    const buffer = await fs.readFile(new URL("../public" + icon.src, import.meta.url));
    const size = Number(icon.sizes.split("x")[0]);
    assert.equal(buffer.readUInt32BE(16), size); assert.equal(buffer.readUInt32BE(20), size);
  }
  const layout = await fs.readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /rel="manifest"[^>]+crossOrigin="use-credentials"/);
});
test("installation caches only six generic resources and does not force activation", async () => {
  const w = worker(); await w.event("install");
  const keys = [...w.stores.get("inversion-public-v3").keys()];
  assert.equal(keys.length, 6); assert.ok(!keys.includes("/")); assert.ok(!keys.some(key => key.startsWith("/api/")));
  assert.equal(w.stats().skipWaiting, 0);
});
test("private API, auth, mutations, and third-party requests are never intercepted", async () => {
  const w = worker();
  for (const path of ["/api/state?session=peace", "/api/image/private", "/api/qr", "/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"]) assert.equal((await w.request(path, { mode: "navigate" })).intercepted, false, path);
  assert.equal((await w.request("/", { method: "POST" })).intercepted, false);
  assert.equal((await w.request("/", { url: "https://auth.example/" })).intercepted, false);
});
test("online private HTML is returned from the network but never enters the cache", async () => {
  const w = worker(); await w.event("install");
  assert.equal(await (await w.request("/", { mode: "navigate" })).response.text(), "PRIVATE RESPONSE DATA");
  for (const store of w.stores.values()) assert.ok(!store.has("/"));
});
test("offline navigation returns the generic fallback without cached account data", async () => {
  const w = worker(); await w.event("install"); w.offline(true);
  assert.equal(await (await w.request("/?capture=1", { mode: "navigate" })).response.text(), offlineHtml);
  assert.equal((await w.request("/api/state?session=peace")).intercepted, false);
});
test("redirected sign-in pages cannot poison the offline cache", async () => {
  const w = worker(); w.authRedirect(true);
  await assert.rejects(w.event("install"), /safely cached/);
  assert.equal(w.stores.size, 0);
});
test("activation removes only old Inversion public caches", async () => {
  const w = worker(); w.stores.set("inversion-public-v0", new Map()); w.stores.set("another-app", new Map());
  await w.event("install"); await w.event("activate");
  assert.deepEqual(w.deleted, ["inversion-public-v0"]); assert.ok(w.stores.has("another-app")); assert.equal(w.stats().claims, 1);
});
test("offline HTML is embedded locally and never fetched from a rewriting host", async () => {
  const match = script.match(/const OFFLINE_HTML = ([^\r\n]+);/);
  assert.ok(match, "Run node scripts/generate-offline-page.mjs after editing offline.html");
  assert.equal(JSON.parse(match[1]), offlineHtml);
  const w = worker(); w.cleanRedirect(true); await w.event("install"); w.offline(true);
  assert.equal(await (await w.request("/", { mode: "navigate" })).response.text(), offlineHtml);
  const poisoned = worker(); poisoned.cleanRedirect(true); poisoned.fakeOffline(true);
  await poisoned.event("install"); poisoned.offline(true);
  assert.equal(await (await poisoned.request("/", { mode: "navigate" })).response.text(), offlineHtml);
});
