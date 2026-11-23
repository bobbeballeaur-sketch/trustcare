"use client";
// "Which doctor do I need?" — 3 simple steps. It suggests a TYPE of doctor and
// flags emergencies. It never diagnoses and never suggests medicines.
import Link from "next/link";
import { useMemo, useState } from "react";
import { Phone, Siren, HeartHandshake, ArrowRight } from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";

type Rule = { id: string; bodyArea: string; symptom: string; symptomHindi: string; appliesTo: string; specSlug: string | null; isEmergency: boolean; isSelfHarm: boolean };
type Spec = { slug: string; name: string; simpleName: string; hindiName: string };
type Hospital = { id: string; name: string; address: string; area: string; phone: string; ayushman: boolean };
type Doc = { id: string; name: string; area: string; fee: number; rating: number };

const WHO = [
  ["adult", "Adult", "वयस्क"], ["child", "Child", "बच्चा"], ["pregnant", "Pregnant woman", "गर्भवती महिला"], ["senior", "Senior (60+)", "बुज़ुर्ग (60+)"],
] as const;
const AREAS = [
  ["skin", "Skin & hair", "त्वचा और बाल", "🧴"], ["teeth", "Teeth & mouth", "दांत और मुंह", "🦷"], ["eyes", "Eyes", "आंखें", "👁"],
  ["ent", "Ear, nose, throat", "कान, नाक, गला", "👂"], ["chest", "Chest & breathing", "सीना और सांस", "🫁"], ["heart", "Heart", "दिल", "❤"],
  ["stomach", "Stomach & digestion", "पेट और पाचन", "🍽"], ["bones", "Bones, joints & back", "हड्डी, जोड़ और कमर", "🦴"], ["head", "Head & nerves", "सिर और नसें", "🧠"],
  ["mind", "Mind & mood", "मन और मूड", "💭"], ["urine", "Urine & kidneys", "पेशाब और किडनी", "💧"], ["women", "Women's health", "महिला स्वास्थ्य", "♀"],
  ["general", "General: fever & tiredness", "सामान्य: बुखार और थकान", "🌡"],
] as const;

export function Guide({ rules, specs, hospitals, doctorsBySpec }: { rules: Rule[]; specs: Spec[]; hospitals: Hospital[]; doctorsBySpec: Record<string, Doc[]> }) {
  const { lang, announce } = useApp();
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [ticked, setTicked] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const options = useMemo(() => rules.filter((r) => r.bodyArea === area && (r.appliesTo === "all" || r.appliesTo === who || (who === "senior" && r.appliesTo === "adult"))), [rules, area, who]);
  const chosen = rules.filter((r) => ticked.includes(r.id));
  const emergency = chosen.some((r) => r.isEmergency);
  const selfHarm = chosen.some((r) => r.isSelfHarm);
  const counts = new Map<string, number>();
  for (const r of chosen) if (r.specSlug) counts.set(r.specSlug, (counts.get(r.specSlug) ?? 0) + 1);
  const bestSlug = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? (who === "child" ? "paediatrician" : "general-physician");
  const spec = specs.find((s) => s.slug === bestSlug);

  const go = (n: number) => { setStep(n); setShowResult(false); announce(pick(lang, `Step ${n} of 3`, `चरण ${n} / 3`)); };
  const card = "flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left text-base";

  return (
    <div>
      <ol aria-label="Guide steps" className="mb-8 grid grid-cols-3 gap-2 text-sm">
        {[pick(lang, "Who is it for?", "किसके लिए?"), pick(lang, "Where is the problem?", "समस्या कहां है?"), pick(lang, "What do you notice?", "क्या लक्षण हैं?")].map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} className={`flex flex-col gap-1.5 ${step >= i + 1 ? "text-ink" : "text-ink-3"} ${step === i + 1 ? "font-semibold" : ""}`}>
            <span aria-hidden="true" className={`h-1.5 rounded-full ${step > i ? "bg-ink" : "bg-line"}`} />{i + 1} · {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <fieldset>
          <legend className="mb-4 text-2xl font-medium">{pick(lang, "Step 1: Who is it for?", "चरण 1: यह किसके लिए है?")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {WHO.map(([k, en, hi]) => (
              <button key={k} type="button" aria-pressed={who === k} onClick={() => { setWho(k); go(2); }} className={`${card} ${who === k ? "border-ink bg-soft" : "border-[#cfc9bf] hover:bg-soft"}`}>{pick(lang, en, hi)}</button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset>
          <legend className="mb-4 text-2xl font-medium">{pick(lang, "Step 2: Where is the problem?", "चरण 2: समस्या कहां है?")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.filter(([k]) => k !== "women" || who === "adult" || who === "pregnant" || who === "senior").map(([k, en, hi, icon]) => (
              <button key={k} type="button" aria-pressed={area === k} onClick={() => { setArea(k); setTicked([]); go(3); }} className={`${card} ${area === k ? "border-ink bg-soft" : "border-[#cfc9bf] hover:bg-soft"}`}>
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-xl">{icon}</span>{pick(lang, en, hi)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(1)} className="mt-5 text-sm underline underline-offset-4">← {pick(lang, "Back", "पीछे")}</button>
        </fieldset>
      )}

      {step === 3 && (
        <div>
          <fieldset>
            <legend className="mb-4 text-2xl font-medium">{pick(lang, "Step 3: Tick everything that applies", "चरण 3: जो भी लागू हो उसे चुनें")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((r) => (
                <label key={r.id} className={`${card} cursor-pointer ${ticked.includes(r.id) ? "border-ink bg-soft" : "border-[#cfc9bf]"}`}>
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-ink" checked={ticked.includes(r.id)} onChange={(e) => { setShowResult(false); setTicked(e.target.checked ? [...ticked, r.id] : ticked.filter((x) => x !== r.id)); }} />
                  <span>{lang === "hi" ? r.symptomHindi : r.symptom}{lang === "en" && <span lang="hi" className="block text-sm text-ink-2">{r.symptomHindi}</span>}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => go(2)} className="h-12 rounded-full border border-[#cfc9bf] px-5">← {pick(lang, "Back", "पीछे")}</button>
            <button type="button" disabled={ticked.length === 0} onClick={() => { setShowResult(true); announce(emergency ? "This may be an emergency." : "Suggestion ready."); setTimeout(() => document.getElementById("guide-result")?.focus(), 50); }} className="h-12 rounded-full bg-ink px-6 font-medium text-white disabled:bg-[#8a857e]">
              {pick(lang, "Show which doctor to see", "कौन सा डॉक्टर, दिखाएं")}
            </button>
          </div>
        </div>
      )}

      {showResult && step === 3 && (
        <div id="guide-result" tabIndex={-1} className="mt-8 scroll-mt-28">
          {emergency ? (
            <section role="alert" className="rounded-3xl border-4 border-danger bg-danger-soft p-6 text-danger">
              <h2 className="flex items-center gap-3 text-2xl font-semibold"><Siren size={32} aria-hidden="true" /> {pick(lang, "This may be an emergency.", "यह आपातकाल हो सकता है।")}</h2>
              <p className="mt-2 text-lg text-ink">{pick(lang, "Go to the nearest hospital now or call 112.", "तुरंत नज़दीकी अस्पताल जाएं या 112 पर कॉल करें।")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="tel:112" className="inline-flex h-14 items-center gap-2 rounded-full bg-danger px-7 text-lg font-semibold text-white"><Phone size={20} aria-hidden="true" /> {pick(lang, "Call 112", "112 पर कॉल करें")}</a>
                <a href="tel:108" className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-danger bg-white px-7 text-lg font-semibold text-danger"><Phone size={20} aria-hidden="true" /> 108 {pick(lang, "Ambulance", "एम्बुलेंस")}</a>
              </div>
              <h3 className="mt-6 font-semibold text-ink">{pick(lang, "Nearest 24×7 hospitals (demo)", "नज़दीकी 24×7 अस्पताल (डेमो)")}</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {hospitals.map((h) => (
                  <li key={h.id} className="rounded-2xl bg-white p-4 text-ink">
                    <p className="font-medium">{h.name}</p><p className="text-sm text-ink-2">{h.address}, {h.area}</p>
                    <a href={`tel:${h.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold underline"><Phone size={14} aria-hidden="true" /> {h.phone}</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : selfHarm ? (
            <section className="rounded-3xl bg-info-soft p-6">
              <h2 className="flex items-center gap-3 text-2xl font-medium"><HeartHandshake size={30} aria-hidden="true" /> {pick(lang, "You don't have to face this alone.", "आप अकेले नहीं हैं।")}</h2>
              <p className="mt-2">{pick(lang, "Talking to someone helps. Tele-MANAS is free, confidential and available 24×7 in Hindi and English.", "किसी से बात करना मदद करता है। टेली-मानस मुफ़्त, गोपनीय और 24×7 उपलब्ध है।")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="tel:14416" className="inline-flex h-14 items-center gap-2 rounded-full bg-ink px-7 text-lg font-semibold text-white"><Phone size={20} aria-hidden="true" /> Tele-MANAS 14416</a>
                <a href="tel:112" className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-white px-7 text-lg font-semibold"><Phone size={20} aria-hidden="true" /> 112</a>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/doctors?spec=psychiatrist" className="rounded-full border border-[#cfc9bf] bg-white px-5 py-3 text-sm font-medium">{pick(lang, "See psychiatrists", "मनोचिकित्सक देखें")}</Link>
                <Link href="/doctors?spec=psychologist" className="rounded-full border border-[#cfc9bf] bg-white px-5 py-3 text-sm font-medium">{pick(lang, "See counsellors (psychologists)", "काउंसलर देखें")}</Link>
              </div>
            </section>
          ) : spec ? (
            <section className="rounded-3xl border-2 border-ink p-6">
              <h2 className="text-2xl font-medium">
                {pick(lang, "You may want to see a", "आप दिखा सकते हैं:")} <b>{lang === "hi" ? spec.hindiName : spec.simpleName} ({spec.name})</b>.
              </h2>
              <p className="mt-2 text-ink-2">{pick(lang, "If you're not sure, a General Physician is always a good first step.", "अगर पक्का नहीं है, तो सामान्य चिकित्सक से शुरुआत करना हमेशा ठीक है।")}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                {(doctorsBySpec[spec.slug] ?? []).map((d) => (
                  <li key={d.id}><Link href={`/doctors/${d.id}`} className="block rounded-2xl bg-soft p-4 hover:bg-card"><b className="font-medium">{d.name}</b><span className="block text-sm text-ink-2">{d.area} · ₹{d.fee} · {d.rating.toFixed(1)} out of 5</span></Link></li>
                ))}
              </ul>
              <Link href={`/doctors?spec=${spec.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-white">{pick(lang, "See all", "सभी देखें")} {lang === "hi" ? spec.hindiName : spec.simpleName}s <ArrowRight size={16} aria-hidden="true" /></Link>
            </section>
          ) : null}
        </div>
      )}

      <p className="mt-10 rounded-2xl bg-soft p-4 text-sm text-ink-2">
        <b className="text-ink">{pick(lang, "Please note:", "ध्यान दें:")}</b>{" "}
        {pick(lang, "This guide only suggests which type of doctor to see. It is not a diagnosis or medical advice, and it never suggests medicines.", "यह गाइड सिर्फ़ बताती है कि किस तरह के डॉक्टर को दिखाएं। यह निदान या चिकित्सा सलाह नहीं है, और दवाएं नहीं सुझाती।")}
      </p>
    </div>
  );
}
