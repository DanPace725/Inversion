import type { Reflection, Theme } from "./domain";
export type Workspace = { responses: Reflection[]; groups: Theme[]; groupVersion: number; snapshot: number | null; aiReady: boolean };
export const EMPTY: Workspace = { responses: [], groups: [], groupVersion: 0, snapshot: null, aiReady: false };
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, { method, headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const data = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(data.error || "Could not complete that action."); return data;
}
export function message(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please retry."; }
export function download(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
