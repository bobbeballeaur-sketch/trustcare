"use client";
// Reads one part of the page aloud (e.g. a doctor's profile).
import { Volume2, VolumeX } from "lucide-react";
import { useApp } from "./providers";
import { pick } from "@/lib/i18n";

export function ListenButton({ targetId, className = "" }: { targetId: string; className?: string }) {
  const { lang, speaking, speak, stopSpeaking } = useApp();
  return (
    <button
      type="button"
      onClick={() => (speaking ? stopSpeaking() : speak(document.getElementById(targetId)?.innerText ?? ""))}
      className={className}
    >
      {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
      {speaking ? pick(lang, "Stop", "रोकें") : pick(lang, "Listen", "सुनें")}
    </button>
  );
}
