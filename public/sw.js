/* Only generic, explicitly listed resources enter this cache. Never cache an account page or API response. */
const CACHE_NAME = "inversion-public-v3";
const OFFLINE_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n  <meta name=\"theme-color\" content=\"#35364b\">\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"apple-mobile-web-app-title\" content=\"Inversion\">\n  <link rel=\"manifest\" href=\"/manifest.webmanifest\" crossorigin=\"use-credentials\">\n  <link rel=\"apple-touch-icon\" href=\"/icons/apple-touch-icon.png\">\n  <link rel=\"stylesheet\" href=\"/offline.css\">\n  <title>Inversion · Reconnect</title>\n</head>\n<body>\n  <main>\n    <img src=\"/icons/icon-192.png\" width=\"70\" height=\"70\" alt=\"Inversion\">\n    <p class=\"eyebrow\">REFLECTION STUDIO</p>\n    <h1>A moment to reconnect.</h1>\n    <p>Connect to the internet to reopen your private workspace and continue uploading or transcribing.</p>\n    <aside>If you saved photos in the app, leave this device's browser data intact. Reopen the workspace with the same account to retry pending uploads. Keep the originals until receipt is confirmed.</aside>\n    <a href=\"/\">Try opening the workspace</a>\n    <p class=\"footnote\">You can still use a presentation you previously downloaded. New capture, review, and AI processing require the workspace to be open.</p>\n  </main>\n</body>\n</html>\n";
const PUBLIC_ASSETS = new Map([
  ["/offline.css", "text/css"],
  ["/icons/icon-192.png", "image/png"],
  ["/icons/icon-512.png", "image/png"],
  ["/icons/icon-maskable-512.png", "image/png"],
  ["/icons/apple-touch-icon.png", "image/png"],
]);
function mayCache(pathname, response) {
  if (!response.ok || response.redirected || !response.url) return false;
  const actual = new URL(response.url);
  return actual.origin === self.location.origin && actual.pathname === pathname && !actual.search &&
    (response.headers.get("content-type") || "").split(";")[0] === PUBLIC_ASSETS.get(pathname);
}
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const resources = await Promise.all([...PUBLIC_ASSETS.keys()].map(async pathname => {
      const response = await fetch(pathname, { cache: "reload", credentials: "same-origin" });
      if (!mayCache(pathname, response)) throw new Error("The offline resources could not be safely cached.");
      return [pathname, response];
    }));
    const cache = await caches.open(CACHE_NAME);
    // Never fetch/cache HTML from the host: it rewrites .html URLs and bodies.
    await cache.put("/offline.html", new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html;charset=utf-8" } }));
    for (const [pathname, response] of resources) await cache.put(pathname, response);
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
