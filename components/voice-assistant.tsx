"use client";
// Voice assistant for elderly users: tap "Speak", say a command in English or
// Hindi, and the site acts and answers back aloud. It matches keywords — no AI.
// Works in Chrome and Edge; the button hides in browsers without speech support.
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, X } from "lucide-react";
import { useApp } from "./providers";
import { pick } from "@/lib/i18n";
import { interpretVoice } from "@/lib/voice";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

export function getRecognition(lang: "en" | "hi"): SR | null {
  if (typeof window === "undefined") return null;
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = lang === "hi" ? "hi-IN" : "en-IN";
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
}

export function VoiceAssistant() {
  const { lang, speak, toast } = useApp();
  const router = useRouter();
  // True only in browsers with speech recognition (Chrome, Edge). False on the server.
  const supported = useSyncExternalStore(
    () => () => {},
    () => !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef<SR>(null);

  if (!supported) return null;

  const start = () => {
    const rec = getRecognition(lang);
    if (!rec) return;
    recRef.current = rec;
    setHeard("");
    setListening(true);
    rec.onresult = (e: any) => {
      const said: string = e.results[0][0].transcript;
      setHeard(said);
      const action = interpretVoice(said);
      if (!action) {
        const msg = pick(lang, "Sorry, I didn't understand. Try: skin doctor in Vijay Nagar.", "माफ़ कीजिए, समझ नहीं आया। बोलिए: विजय नगर में त्वचा डॉक्टर।");
        speak(msg);
        toast(msg, "info");
        return;
      }
      if (action.kind === "read") {
        speak(document.getElementById("main")?.innerText || "");
        return;
      }
      speak(pick(lang, action.replyEn, action.replyHi));
      router.push(action.href);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {(listening || heard) && (
        <div role="status" className="max-w-[260px] rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-xl ring-1 ring-line">
          {listening ? pick(lang, "Listening… say e.g. “skin doctor in Vijay Nagar”", "सुन रहे हैं… जैसे बोलिए “विजय नगर में त्वचा डॉक्टर”") : <>“{heard}”</>}
          {!listening && (
            <button type="button" onClick={() => setHeard("")} aria-label="Close" className="ml-2 inline-flex align-middle text-ink-2">
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => (listening ? recRef.current?.stop() : start())}
        aria-pressed={listening}
        className={`flex h-14 items-center gap-2 rounded-full pl-2 pr-5 text-[0.95rem] font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,.3)] transition ${listening ? "bg-accent-ink" : "bg-ink hover:bg-ink/85"}`}
      >
        <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink ${listening ? "animate-pulse" : ""}`}>
          <Mic size={18} aria-hidden="true" />
        </span>
        {listening ? pick(lang, "Listening…", "सुन रहे हैं…") : <>Speak · <span lang="hi">बोलिए</span></>}
      </button>
    </div>
  );
}
