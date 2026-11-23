"use client";
// Accessibility settings: text size, high contrast, reduce motion and
// read-aloud. Choices are remembered in this browser.
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useApp } from "./providers";
import { t, pick } from "@/lib/i18n";

export function A11yPanel({ onClose }: { onClose: () => void }) {
  const { lang, prefs, setPref, speaking, speak, stopSpeaking } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[aria-controls='a11y-panel']")) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      opener?.focus();
    };
  }, [onClose]);

  const text = prefs.text ?? "normal";
  const seg = (active: boolean) =>
    `h-11 flex-1 rounded-xl border text-ink transition ${active ? "border-ink bg-ink text-white" : "border-line bg-white hover:bg-soft"}`;

  return (
    <div
      id="a11y-panel"
      ref={ref}
      role="dialog"
      aria-label={t(lang, "accessibility")}
      className="absolute right-0 top-12 z-50 w-[min(92vw,340px)] rounded-2xl border border-line bg-white p-4 text-ink shadow-2xl"
    >
      <p className="eyebrow mb-3 text-ink-2">{t(lang, "accessibility")}</p>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium">{pick(lang, "Text size", "टेक्स्ट का आकार")}</legend>
        <div className="flex gap-2">
          <button type="button" className={seg(text === "small")} aria-pressed={text === "small"} aria-label={t(lang, "textSmaller")} onClick={() => setPref("text", "small")}>A−</button>
          <button type="button" className={`${seg(text === "normal")} text-lg`} aria-pressed={text === "normal"} aria-label={t(lang, "textNormal")} onClick={() => setPref("text", "normal")}>A</button>
          <button type="button" className={`${seg(text === "large")} text-xl`} aria-pressed={text === "large"} aria-label={t(lang, "textLarger")} onClick={() => setPref("text", "large")}>A+</button>
        </div>
      </fieldset>

      <div className="mb-2 flex flex-col gap-2">
        <Toggle label={t(lang, "highContrast")} on={prefs.contrast === "high"} onChange={(v) => setPref("contrast", v ? "high" : "normal")} />
        <Toggle label={t(lang, "reduceMotion")} on={prefs.motion === "reduce"} onChange={(v) => setPref("motion", v ? "reduce" : "normal")} />
      </div>

      <button
        type="button"
        onClick={() => {
          if (speaking) return stopSpeaking();
          const main = document.getElementById("main");
          speak(main?.innerText || document.body.innerText);
        }}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink font-medium text-white hover:bg-ink/85"
      >
        {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
        {speaking ? t(lang, "stop") : pick(lang, "Listen to this page", "यह पेज सुनें")}
      </button>

      <Link href="/accessibility" className="mt-3 block text-center text-sm text-ink-2 underline underline-offset-4">
        {pick(lang, "Accessibility statement", "सुलभता विवरण")}
      </Link>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-12 items-center justify-between rounded-xl border border-line px-3 text-left hover:bg-soft"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className={`flex items-center gap-2 text-xs font-semibold ${on ? "text-ok" : "text-ink-2"}`}>
        {on ? "ON" : "OFF"}
        <span aria-hidden="true" className={`relative h-6 w-10 rounded-full transition ${on ? "bg-ok" : "bg-line"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </span>
    </button>
  );
}
