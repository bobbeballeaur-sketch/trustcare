"use client";
// App-wide client state: language, accessibility preferences, read-aloud and
// toast messages (also announced to screen readers through an ARIA live region).
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

type Prefs = { text?: "small" | "normal" | "large"; contrast?: "high" | "normal"; motion?: "reduce" | "normal" };
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  prefs: Prefs;
  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  speaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  toast: (text: string, kind?: Toast["kind"]) => void;
  announce: (text: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside <Providers>");
  return c;
}

export function Providers({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("tc_a11y") || "{}"); } catch { return {}; }
  });
  const [speaking, setSpeaking] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [liveText, setLiveText] = useState("");
  const idRef = useRef(0);

  const setPref: Ctx["setPref"] = useCallback((k, v) => {
    setPrefs((old) => {
      const next = { ...old, [k]: v };
      try { localStorage.setItem("tc_a11y", JSON.stringify(next)); } catch {}
      const h = document.documentElement;
      const attr = k === "text" ? "text" : k === "contrast" ? "contrast" : "motion";
      if (v && v !== "normal") h.dataset[attr] = String(v);
      else delete h.dataset[attr];
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    router.refresh();
  }, [router]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Read text aloud with the browser's built-in voice (Hindi voice when site is in Hindi).
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 6000));
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang === "hi" ? "hi" : "en-IN"));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [lang]);

  const announce = useCallback((text: string) => {
    setLiveText("");
    setTimeout(() => setLiveText(text), 50);
  }, []);

  const toast = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, text }]);
    announce(text);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, [announce]);

  return (
    <AppCtx.Provider value={{ lang, setLang, prefs, setPref, speaking, speak, stopSpeaking, toast, announce }}>
      {children}
      {/* Screen-reader announcements for live updates */}
      <div aria-live="polite" role="status" className="sr-only">{liveText}</div>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.kind === "error" ? "bg-danger text-white" : t.kind === "info" ? "bg-ink text-white" : "bg-ok text-white"
            }`}
          >
            <span aria-hidden="true">{t.kind === "error" ? "⚠" : t.kind === "info" ? "ℹ" : "✓"}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
