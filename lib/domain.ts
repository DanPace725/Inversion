export const SESSIONS = [
  { id: "peace", title: "Peace", question: "Where do you find peace?", when: "Friday evening", color: "#666bad" },
  { id: "pursuit", title: "Pursuit", question: "What are you chasing?", when: "Saturday morning", color: "#ad7650" },
  { id: "passion", title: "Passion", question: "What's your passion?", when: "Saturday evening", color: "#ac6374" },
  { id: "purpose", title: "Purpose", question: "What's your purpose?", when: "Sunday morning", color: "#5a8979" },
] as const;
export type SessionId = typeof SESSIONS[number]["id"];
export type Reflection = {
  id: string; session: string; medium: string; status: string;
  draft: string; text: string; warnings: string; verified: number;
  permission: number; approved: number; excerpt: string; error: string;
  created: number; updated: number; version: number; has_image: boolean;
};
export type Theme = { id: string; title: string; description: string; responseIds: string[] };
export type Presentation = { question: string; title: string; created: number; reviewed: number;
  groups: { title: string; description: string; count: number }[];
  quotes: { text: string; medium: string }[]; media: { medium: string; count: number }[] };
export function sessionOf(value: string | null | undefined) {
  return SESSIONS.find(x => x.id === value) ?? null;
}
export function cleanThemes(input: unknown, records: Pick<Reflection, "id" | "verified">[]): Theme[] {
  if (!Array.isArray(input) || input.length > 12) throw new Error("Use up to 12 groups.");
  const valid = new Set(records.filter(r => r.verified).map(r => r.id));
  const ids = new Set<string>();
  return input.map((item, i) => {
    if (!item || typeof item.title !== "string" || !item.title.trim()) throw new Error("Every group needs a title.");
    if (!Array.isArray(item.responseIds) || item.responseIds.some((id: unknown) => typeof id !== "string" || !valid.has(id))) throw new Error("Groups may only contain verified responses from this session.");
    const id = typeof item.id === "string" ? item.id.slice(0, 80) : `theme-${i + 1}`;
    if (ids.has(id)) throw new Error("Group identifiers must be unique.");
    ids.add(id);
    return { id, title: item.title.trim().slice(0, 120), description: String(item.description ?? "").slice(0, 600), responseIds: [...new Set<string>(item.responseIds)] };
  });
}
export function makePresentation(session: typeof SESSIONS[number], records: Reflection[], themes: Theme[]): Presentation {
  const reviewed = records.filter(r => r.verified);
  const groups = cleanThemes(themes, records).map(g => ({ title: g.title, description: g.description, count: g.responseIds.length }));
  const quotes = reviewed.filter(r => r.permission && r.approved && r.excerpt.trim()).map(r => ({ text: r.excerpt, medium: r.medium }));
  return { question: session.question, title: session.title, created: Date.now(), reviewed: reviewed.length,
    groups, quotes, media: [...new Set(reviewed.map(r => r.medium))].map(medium => ({ medium, count: reviewed.filter(r => r.medium === medium).length })) };
}
export function safeError(status: number): string {
  if (status === 401 || status === 403) return "AI access was rejected. Check the server's API key and model access.";
  if (status === 429) return "AI quota or rate limit reached. Wait before retrying and check API billing.";
  return "AI processing did not finish. Your response is saved; retry or transcribe manually.";
}
