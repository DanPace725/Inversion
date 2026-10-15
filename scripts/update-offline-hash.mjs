import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const digest = createHash("sha256").update(await fs.readFile("public/offline.html")).digest("hex");
const worker = await fs.readFile("public/sw.js", "utf8");
const updated = worker.replace(/const OFFLINE_SHA256 = "[^"]+";/, `const OFFLINE_SHA256 = "${digest}";`);
if (worker === updated && !worker.includes(digest)) throw new Error("Offline integrity declaration is missing");
if (worker !== updated) await fs.writeFile("public/sw.js", updated);
console.log("Offline page integrity hash is current.");
