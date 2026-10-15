import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { safeError, type Reflection } from "./domain";

export async function access(request: Request) {
  const user = await getChatGPTUser();
  if (!user) throw new ApiError(401, "Sign in with your ChatGPT account to open this private workspace.");
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new ApiError(403, "Please use the app's own window.");
    if (request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "Cross-site writes are not allowed.");
  }
  if (!env.DB || !env.BUCKET) throw new ApiError(503, "Workspace storage is not ready yet.");
  return { owner: user.userId, db: env.DB, bucket: env.BUCKET };
}
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function json(request: Request) {
  const text = await request.text();
  if (text.length > 1_000_000) throw new ApiError(413, "That import is too large.");
  try { return JSON.parse(text); } catch { throw new ApiError(400, "Could not read that request."); }
}
export async function records(db: D1Database, owner: string, session: string): Promise<Reflection[]> {
  const result = await db.prepare("SELECT id,session,medium,status,draft,text,warnings,verified,permission,approved,excerpt,error,created,updated,version,(image_key IS NOT NULL) AS has_image FROM responses WHERE owner=? AND session=? ORDER BY created DESC").bind(owner, session).all<Reflection>();
  return result.results;
}
export async function ai(instructions: string, content: unknown[], name: string, schema: unknown) {
  if (!env.OPENAI_API_KEY) throw new ApiError(503, "The server's AI key is not configured. Manual entry still works.");
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4.1-mini", store: false, instructions,
        input: [{ role: "user", content }], max_output_tokens: 6000,
        text: { format: { type: "json_schema", name, strict: true, schema } } }),
      signal: AbortSignal.timeout(80_000),
    });
  } catch { throw new ApiError(502, "AI connection interrupted. Your response is saved; retry when connected."); }
  if (!response.ok) throw new ApiError(502, safeError(response.status));
  const data = await response.json() as { status: string; output?: { content?: { type: string; text?: string }[] }[] };
  if (data.status !== "completed") throw new ApiError(502, "AI output was incomplete. Try again or enter the text manually.");
  const text = data.output?.flatMap(o => o.content ?? []).filter(c => c.type === "output_text").map(c => c.text).join("");
  try { return JSON.parse(text || ""); } catch { throw new ApiError(502, "AI did not return usable text. Try again or enter it manually."); }
}
