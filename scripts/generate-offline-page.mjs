import fs from "node:fs/promises";
const html = await fs.readFile("public/offline.html", "utf8");
const worker = await fs.readFile("public/sw.js", "utf8");
const updated = worker.replace(/const OFFLINE_HTML = [^\r\n]+;/, `const OFFLINE_HTML = ${JSON.stringify(html)};`);
if (worker === updated && !worker.includes(JSON.stringify(html))) throw new Error("Offline page declaration is missing");
if (worker !== updated) await fs.writeFile("public/sw.js", updated);
console.log("Embedded generic offline page is current.");
