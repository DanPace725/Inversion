/* Only generic, explicitly listed resources enter this cache. Never cache an account page or API response. */
const CACHE_NAME = "inversion-public-v1";
const PUBLIC_ASSETS = new Map([
  ["/offline.html", "text/html"],
  ["/offline.css", "text/css"],
  ["/icons/icon-192.png", "image/png"],
  ["/icons/icon-512.png", "image/png"],
  ["/icons/icon-maskable-512.png", "image/png"],
  ["/icons/apple-touch-icon.png", "image/png"],
]);
function mayCache(pathname, response) {
  if (!response.ok || response.redirected || !response.url) return false;
  const actual = new URL(response.url);
  return actual.origin === self.location.origin && actual.pathname === pathname &&
    (response.headers.get("content-type") || "").split(";")[0] === PUBLIC_ASSETS.get(pathname);
}
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const [pathname] of PUBLIC_ASSETS) {
      const response = await fetch(pathname, { cache: "reload", credentials: "same-origin" });
      if (!mayCache(pathname, response)) throw new Error("The offline resources could not be safely cached.");
      await cache.put(pathname, response);
    }
    // Updates wait for the app to close or for an explicit update request.
    // Do not force a reload while photos or review edits may be unsaved.
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith("inversion-public-") && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "ACTIVATE_UPDATE") void self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || ["/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"].includes(url.pathname)) return;
  if (request.mode === "navigate" && ["/", "/present"].includes(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match("/offline.html")) || Response.error();
    }));
    return;
  }
  if (PUBLIC_ASSETS.has(url.pathname) && !url.search) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME), saved = await cache.match(url.pathname);
      if (saved) return saved;
      const response = await fetch(request);
      if (mayCache(url.pathname, response)) await cache.put(url.pathname, response.clone());
      return response;
    })());
  }
});
