"use client";
// Search box with area picker and a microphone for voice search.
// It is a normal HTML form (GET /doctors), so it also works without JavaScript.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Mic, MapPin, Search } from "lucide-react";
import { useApp } from "./providers";
import { pick } from "@/lib/i18n";
import { getRecognition } from "./voice-assistant";
import { interpretVoice } from "@/lib/voice";

type Area = { name: string; hindiName: string };

export function SearchBox({
  areas,
  defaultQuery = "",
  defaultArea = "",
  variant = "glass",
}: {
  areas: Area[];
  defaultQuery?: string;
  defaultArea?: string;
  variant?: "glass" | "light";
}) {
  const { lang, toast } = useApp();
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [listening, setListening] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const glass = variant === "glass";

  const voice = () => {
    const rec = getRecognition(lang);
    if (!rec) {
      toast(pick(lang, "Voice search works in Chrome and Edge.", "आवाज़ से खोज Chrome और Edge में चलती है।"), "info");
      return;
    }
    setListening(true);
    rec.onresult = (e: { results: { 0: { transcript: string } }[] }) => {
      const said = e.results[0][0].transcript;
      setQ(said);
      const action = interpretVoice(said);
      if (action?.kind === "nav" && action.href.startsWith("/doctors")) router.push(action.href);
      else router.push(`/doctors?q=${encodeURIComponent(said)}`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const field = glass
    ? "bg-white/95 text-ink placeholder:text-ink-3"
    : "bg-soft text-ink placeholder:text-ink-3";

  return (
    <form
      ref={formRef}
      role="search"
      action="/doctors"
      className={`flex w-full flex-wrap gap-2 rounded-[22px] p-2 ${glass ? "bg-white/15 ring-1 ring-white/25 backdrop-blur-md" : "border border-line bg-white"}`}
    >
      <label className={`flex h-14 min-w-0 flex-[1_1_260px] items-center gap-2 rounded-2xl px-4 ${field}`}>
        <Search size={18} aria-hidden="true" className="shrink-0 text-ink-2" />
        <span className="sr-only">{pick(lang, "Search by doctor, specialisation or symptom", "डॉक्टर, विशेषज्ञता या लक्षण से खोजें")}</span>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={pick(lang, "Doctor, specialisation or symptom", "डॉक्टर, विशेषज्ञता या लक्षण")}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
          maxLength={80}
        />
      </label>
      <label className={`flex h-14 flex-[0_1_200px] items-center gap-2 rounded-2xl px-3 ${field}`}>
        <MapPin size={18} aria-hidden="true" className="shrink-0 text-ink-2" />
        <span className="sr-only">{pick(lang, "Area of Indore", "इंदौर का क्षेत्र")}</span>
        <select name="area" defaultValue={defaultArea} className="h-full w-full bg-transparent text-base outline-none">
          <option value="">{pick(lang, "All areas", "सभी क्षेत्र")}</option>
          {areas.map((a) => (
            <option key={a.name} value={a.name}>{lang === "hi" ? a.hindiName : a.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={voice}
        aria-label={pick(lang, "Search by voice", "आवाज़ से खोजें")}
        aria-pressed={listening}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${glass ? "bg-white/95 text-ink hover:bg-white" : "bg-soft text-ink hover:bg-card"} ${listening ? "animate-pulse ring-2 ring-accent" : ""}`}
      >
        <Mic size={20} aria-hidden="true" />
      </button>
      <button type="submit" className={`h-14 rounded-2xl px-6 text-base font-medium ${glass ? "bg-ink text-white hover:bg-ink/85" : "bg-ink text-white hover:bg-ink/85"}`}>
        {pick(lang, "Search", "खोजें")}
      </button>
    </form>
  );
}
