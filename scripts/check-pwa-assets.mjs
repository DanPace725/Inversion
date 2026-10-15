// Read service access only from hidden stdin; never persist or print it.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const input = await new Promise((resolve, reject) => {
  let value = "";
  const terminal = process.stdin.isTTY;
  const finish = () => {
    process.stdin.removeListener("data", data); process.stdin.removeListener("end", finish);
    if (terminal) process.stdin.setRawMode(false); process.stdin.pause();
    try { resolve(JSON.parse(value)); } catch { reject(new Error("Provide the site URL and optional service token as JSON on stdin.")); }
  };
  const data = chunk => { value += chunk; if (value.length > 65536) { reject(new Error("Input too large")); process.stdin.destroy(); } else if (/[\r\n]/.test(value)) finish(); };
  if (terminal) { process.stdin.setRawMode(true); process.stderr.write("Ready for release-check JSON on stdin (input is hidden).\n"); }
  process.stdin.setEncoding("utf8"); process.stdin.on("data", data); process.stdin.once("end", finish); process.stdin.resume();
});
const url = new URL(input.url);
assert.equal(url.protocol, "https:");
const headers = input.token ? { "OAI-Sites-Authorization": `Bearer ${input.token}` } : {};
const files = ["manifest.webmanifest", "sw.js", "offline.html", "offline.css", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];
for (const file of files) {
  let response = await fetch(new URL(`/${file}`, url.origin), { headers, redirect: "manual" });
  if (file === "offline.html" && [307, 308].includes(response.status) && response.headers.get("location")) {
    const target = new URL(response.headers.get("location"), url.origin);
    assert.ok(target.origin === url.origin && target.pathname === "/offline" && !target.search, "Unexpected offline-page redirect");
    response = await fetch(target, { headers, redirect: "manual" });
  }
  assert.equal(response.status, 200, `Could not retrieve /${file}; redirect path: ${response.headers.get("location") ? new URL(response.headers.get("location"),url.origin).pathname : "none"}`);
  const live = Buffer.from(await response.arrayBuffer()), local = await fs.readFile(`public/${file}`);
  const digest = buffer => createHash("sha256").update(buffer).digest("hex");
  assert.equal(digest(live), digest(local), `Published /${file} does not match this checkout`);
  if (file === "manifest.webmanifest") assert.match(response.headers.get("content-type") || "", /application\/(manifest\+json|json)/);
  if (file === "sw.js") {
    assert.match(response.headers.get("content-type") || "", /(java|ecma)script/);
    const policy = response.headers.get("cache-control") || "";
    assert.ok(/no-cache|no-store/.test(policy) || (/\bmax-age=0\b/.test(policy) && /\bmust-revalidate\b/.test(policy)), "The service-worker script must be revalidated before reuse");
  }
  console.log(`PASS /${file} matches local SHA-256`);
}
const anonymous = await fetch(new URL("/api/state?session=peace", url.origin), { redirect: "manual" });
if (anonymous.headers.get("content-type")?.includes("application/json")) {
  const payload = await anonymous.json();
  assert.ok(!Array.isArray(payload.responses), "Anonymous API unexpectedly exposed response data");
}
console.log("PASS anonymous API does not expose reflection data");
console.log(JSON.stringify({ passed: files.length + 1, origin: url.origin }));
