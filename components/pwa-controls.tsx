"use client";
import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { captures } from "@/lib/outbox";
import { Modal } from "./studio-panels";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaControls({ owner, pending }: { owner: string; pending: number }) {
  const [installed, setInstalled] = useState(false), [instructions, setInstructions] = useState(false);
  const [ready, setReady] = useState(false), [updating, setUpdating] = useState(false), [error, setError] = useState("");
  const prompt = useRef<InstallEvent | null>(null), registration = useRef<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(standalone.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const installPrompt = (event: Event) => { event.preventDefault(); prompt.current = event as InstallEvent; };
    const appInstalled = () => { prompt.current = null; setInstalled(true); setInstructions(false); };
    updateInstalled(); standalone.addEventListener("change", updateInstalled);
    window.addEventListener("beforeinstallprompt", installPrompt); window.addEventListener("appinstalled", appInstalled);
    let stopped = false, cleanup: (() => void) | undefined;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(reg => {
        if (stopped) return;
        registration.current = reg; setReady(!!reg.waiting);
        const onUpdate = () => {
          const worker = reg.installing;
          const onState = () => { if (!stopped && worker?.state === "installed" && navigator.serviceWorker.controller) setReady(!!reg.waiting); };
          worker?.addEventListener("statechange", onState);
        };
        reg.addEventListener("updatefound", onUpdate); cleanup = () => reg.removeEventListener("updatefound", onUpdate);
        void reg.update().catch(() => { /* retry on a later connected visit */ });
      }).catch(() => { if (!stopped) setError("Offline setup could not finish. Reopen the app while connected to try again."); });
    }
    return () => { stopped = true; cleanup?.(); standalone.removeEventListener("change", updateInstalled); window.removeEventListener("beforeinstallprompt", installPrompt); window.removeEventListener("appinstalled", appInstalled); };
  }, []);
  async function install() {
    setError("");
    const event = prompt.current;
    if (!event) { setInstructions(true); return; }
    try { prompt.current = null; await event.prompt(); const choice = await event.userChoice; if (choice.outcome === "accepted") setInstructions(false); }
    catch { setInstructions(true); }
  }
  async function update() {
    try {
      if (pending || (await captures(owner)).length) { setError("Finish uploading saved photos before updating the app."); setInstructions(true); return; }
      if (!registration.current?.waiting) return;
      if (!confirm("Reload to update Inversion? Save any unsaved review or theme edits first.")) return;
      setUpdating(true);
      navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
      registration.current.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
    } catch { setError("Could not safely check pending photos. Reopen the app later to update."); setInstructions(true); setUpdating(false); }
  }
  return <>
    {!installed && <button className="button subtle pwa-install" onClick={() => void install()}><Download size={15} /> Install app</button>}
    {ready && <button className="button subtle" disabled={pending > 0 || updating} title={pending ? "Finish pending uploads first" : "Save edits before reloading"} onClick={() => void update()}><RefreshCw size={15} /> {updating ? "Updating…" : "Update app"}</button>}
    {instructions && <Modal title="Keep Inversion close." onClose={() => setInstructions(false)}>
      <p>Add the studio to your home screen or desktop. It opens in its own app window, with the same private account and workspace.</p>
      <ol className="help-list"><li><strong>Android / Chrome:</strong> Open this site in Chrome, then choose <strong>Install app</strong> or <strong>Add to Home screen</strong> from the browser menu.</li><li><strong>iPhone / iPad:</strong> Open the site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li><strong>PC / Edge or Chrome:</strong> Use the install icon in the address bar or the browser's app-install menu.</li></ol>
      <p className="modal-tip">Internet is needed to reopen the private workspace, upload, and use AI. While the workspace remains open, photos can queue on this device during interruptions. Installing does not guarantee background uploads.</p>
      {error && <p className="review-warning" role="alert">{error}</p>}
    </Modal>}
    {error && !instructions && <button className="text-button pwa-warning" onClick={() => setInstructions(true)}>Offline setup needs attention</button>}
  </>;
}
