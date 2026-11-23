"use client";
// Home page sections, part 1: trust strip, "verified" dark panel,
// scrolling specialisation chips and the 3-step journey.
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity, ArrowRight, Baby, BadgeCheck, Bone, Brain, CalendarX, Check, Ear, Eye, HeartPulse, Languages,
  MessageCircleHeart, Smile, Sparkles, Stethoscope, Wind, Accessibility as AccessIcon, Droplet, Flower2,
} from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { Photo, Reveal, TwoTone } from "./ui";
import { prefersReducedMotion } from "./smooth-scroll";

/* ---------- 1. Scrolling strip of facts (like Everlab's press logos) ---------- */
export function TrustStrip({ doctors, areas, specs }: { doctors: number; areas: number; specs: number }) {
  const { lang } = useApp();
  const items = [
    pick(lang, `${doctors} verified doctors`, `${doctors} सत्यापित डॉक्टर`),
    pick(lang, `${areas} areas of Indore`, `इंदौर के ${areas} क्षेत्र`),
    pick(lang, `${specs} specialisations`, `${specs} विशेषज्ञताएं`),
    pick(lang, "English & हिंदी", "English और हिंदी"),
    pick(lang, "Screen-reader friendly", "स्क्रीन रीडर के अनुकूल"),
    pick(lang, "15-minute slots", "15 मिनट के स्लॉट"),
  ];
  const row = [...items, ...items];
  return (
    <section aria-label={pick(lang, "TrustCare in numbers", "आंकड़ों में TrustCare")} className="fade-x overflow-hidden py-8">
      <ul className="flex w-max animate-marquee gap-14 whitespace-nowrap">
        {row.map((t, i) => (
          <li key={i} aria-hidden={i >= items.length} className="eyebrow flex items-center gap-3 text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 2. Dark panel: how verification works ---------- */
export function VerifiedPanel() {
  const { lang } = useApp();
  const steps = [
    pick(lang, "Doctor submits registration number and State Medical Council", "डॉक्टर रजिस्ट्रेशन नंबर और राज्य चिकित्सा परिषद बताते हैं"),
    pick(lang, "Our admin checks it on the NMC Indian Medical Register", "हमारी टीम इसे NMC इंडियन मेडिकल रजिस्टर पर जांचती है"),
    pick(lang, "Name, council and year must match before approval", "मंज़ूरी से पहले नाम, परिषद और साल मिलना ज़रूरी"),
    pick(lang, "Only then the doctor appears in search, with the date checked", "तभी डॉक्टर खोज में दिखते हैं, जांच की तारीख के साथ"),
    pick(lang, "Changed details? The profile goes back for re-checking", "जानकारी बदली? प्रोफ़ाइल दोबारा जांच में जाती है"),
  ];
  const extras = [
    { tone: "clay" as const, icon: CalendarX, t: pick(lang, "Leave alerts", "छुट्टी की सूचना"), d: pick(lang, "Doctor on leave? You're told instantly, with a Rebook button.", "डॉक्टर छुट्टी पर? तुरंत सूचना, दोबारा बुक करने का बटन।") },
    { tone: "amber" as const, icon: MessageCircleHeart, t: pick(lang, "Real reviews", "असली समीक्षाएं"), d: pick(lang, "Only patients with a completed visit can review.", "सिर्फ़ पूरी हुई विज़िट वाले मरीज़ समीक्षा कर सकते हैं।") },
    { tone: "olive" as const, icon: Languages, t: pick(lang, "Hindi & voice", "हिंदी और आवाज़"), d: pick(lang, "Switch to Hindi, listen aloud, or just speak.", "हिंदी चुनें, पढ़कर सुनें, या बस बोलें।") },
    { tone: "sand" as const, icon: AccessIcon, t: pick(lang, "Accessible clinics", "सुलभ क्लिनिक"), d: pick(lang, "Filter by ramp, lift, sign language and more.", "रैंप, लिफ्ट, साइन लैंग्वेज से फ़िल्टर करें।") },
  ];
  return (
    <section id="verified" aria-labelledby="verified-title" className="px-2 sm:px-3">
      <div className="relative overflow-hidden rounded-[28px] bg-night-2 px-5 py-14 text-white sm:px-10 md:py-20">
        <div aria-hidden="true" className="absolute -left-40 top-40 h-[600px] w-[600px] rounded-full bg-accent/25 blur-[140px]" />
        <Reveal className="relative mx-auto max-w-6xl">
          <p data-reveal className="eyebrow mb-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> {pick(lang, "Verified doctors only", "सिर्फ़ सत्यापित डॉक्टर")}
          </p>
          <div data-reveal>
            <TwoTone id="verified-title" dark first={pick(lang, "Every doctor here is checked.", "यहां हर डॉक्टर जांचा गया है।")} second={pick(lang, "Before they ever appear.", "दिखने से पहले ही।")} />
          </div>

          <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
            {/* Glowing "verification card" */}
            <div data-reveal className="relative mx-auto w-full max-w-[420px]">
              <div aria-hidden="true" className="absolute inset-0 -z-0 scale-110 rounded-full bg-accent/40 blur-[90px]" />
              <div className="relative aspect-[1.58] rounded-2xl bg-[linear-gradient(150deg,#f08a4b_0%,#c4561f_35%,#5a230c_75%,#2b1209_100%)] p-6 shadow-[0_30px_80px_rgba(232,98,44,.35)] ring-1 ring-white/20">
                <div className="flex items-start justify-between">
                  <span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />
                  <span className="eyebrow text-white/80">NMC · {pick(lang, "Verified", "सत्यापित")}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xl font-medium">Dr. Anjali Mehta</p>
                  <p className="text-sm text-white/75">Reg. MP-10234 · Madhya Pradesh Medical Council</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90"><BadgeCheck size={15} aria-hidden="true" /> {pick(lang, "Checked 12 Nov 2026", "12 नवंबर 2026 को जांचा")}</p>
                </div>
              </div>
            </div>

            <div data-reveal>
              <p className="eyebrow mb-3 text-white/60">{pick(lang, "How we verify", "हम कैसे जांचते हैं")}</p>
              <ul className="space-y-3">
                {steps.map((s) => (
                  <li key={s} className="flex gap-3 text-[0.98rem] text-white/90">
                    <Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> {s}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm">
                <Sparkles size={18} className="shrink-0 text-accent" aria-hidden="true" />
                <span>{pick(lang, "Pending or rejected doctors never appear in search and can't receive bookings.", "लंबित या अस्वीकृत डॉक्टर खोज में नहीं दिखते और बुकिंग नहीं ले सकते।")}</span>
              </div>
              <Link href="/doctors" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-white/90">
                {pick(lang, "Browse verified doctors", "सत्यापित डॉक्टर देखें")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <p data-reveal className="eyebrow mb-4 mt-16 text-white/60">{pick(lang, "Every booking also includes", "हर बुकिंग के साथ")}</p>
          <ul data-reveal className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map(({ tone, icon: Icon, t, d }) => (
              <li key={t} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                <Photo tone={tone} className="flex aspect-[4/3] items-center justify-center">
                  <Icon size={44} strokeWidth={1.4} className="text-white/90 drop-shadow" aria-hidden="true" />
                </Photo>
                <div className="p-4">
                  <p className="font-medium">{t}</p>
                  <p className="mt-1 text-sm text-white/70">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 3. Scrolling rows of specialisation chips ---------- */
const SPEC_ICON: Record<string, React.ElementType> = {
  "general-physician": Stethoscope, dermatologist: Sparkles, dentist: Smile, paediatrician: Baby,
  gynaecologist: Flower2, orthopaedist: Bone, ophthalmologist: Eye, ent: Ear, psychiatrist: Brain,
  psychologist: MessageCircleHeart, cardiologist: HeartPulse, neurologist: Activity,
  gastroenterologist: Droplet, endocrinologist: Droplet, pulmonologist: Wind,
};
const CHIP_TONES = ["clay", "amber", "olive", "sand", "slate", "rose"] as const;

type Spec = { slug: string; name: string; simpleName: string; hindiName: string };

export function SpecialityChips({ specs }: { specs: Spec[] }) {
  const { lang } = useApp();
  const rows = [specs.slice(0, 5), specs.slice(5, 10), specs.slice(10)];
  return (
    <section aria-labelledby="specs-title" className="py-24 md:py-32">
      <Reveal className="mx-auto max-w-3xl px-5 text-center">
        <div data-reveal>
          <TwoTone id="specs-title" first={pick(lang, "Doctors for every concern.", "हर तकलीफ़ के लिए डॉक्टर।")} second={pick(lang, "Explained in plain words.", "आसान शब्दों में।")} />
        </div>
        <p data-reveal className="mx-auto mt-5 max-w-xl text-ink-2">
          {pick(lang, "From a skin rash to a child's fever, find the right specialist in your area of Indore. Medical names are always shown in brackets.", "त्वचा पर चकत्तों से लेकर बच्चे के बुखार तक, अपने इलाके में सही विशेषज्ञ खोजें।")}
        </p>
        <Link data-reveal href="/doctors" className="mt-7 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink/85">
          {pick(lang, "Find a doctor today", "आज ही डॉक्टर खोजें")}
        </Link>
      </Reveal>

      <div className="mt-14 space-y-3">
        {rows.map((row, ri) => {
          const doubled = [...row, ...row, ...row, ...row];
          return (
            <div key={ri} className="fade-x overflow-hidden">
              <ul className={`flex w-max gap-3 ${ri % 2 ? "animate-marquee-rev" : "animate-marquee"} hover:[animation-play-state:paused]`}>
                {doubled.map((s, i) => {
                  const Icon = SPEC_ICON[s.slug] ?? Stethoscope;
                  const hidden = i >= row.length;
                  return (
                    <li key={i} aria-hidden={hidden}>
                      <Link
                        href={`/doctors?spec=${s.slug}`}
                        tabIndex={hidden ? -1 : 0}
                        className="flex items-center gap-3 rounded-xl border border-line bg-soft py-2 pl-2 pr-5 hover:bg-card"
                      >
                        <span className="h-10 w-10 overflow-hidden rounded-lg">
                          <Photo tone={CHIP_TONES[(i + ri) % CHIP_TONES.length]} className="flex h-full w-full items-center justify-center">
                            <Icon size={18} className="text-white" aria-hidden="true" />
                          </Photo>
                        </span>
                        <span className="whitespace-nowrap text-sm font-medium">
                          {lang === "hi" ? s.hindiName : s.simpleName} <span className="text-ink-2">({s.name})</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- 4. Journey: three steps with a line that fills as you scroll ---------- */
export function Journey() {
  const { lang } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(".journey-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 70%", end: "bottom 60%", scrub: true } });
      gsap.utils.toArray<HTMLElement>(".journey-step").forEach((el, i) => {
        gsap.from(el, { y: 40, scale: 0.96, scrollTrigger: { trigger: ref.current, start: `top+=${i * 120} 65%`, end: `top+=${i * 120 + 120} 55%`, scrub: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const steps = [
    { n: "01", big: "60+", t: pick(lang, "Tell us what's wrong", "बताइए क्या तकलीफ़ है"), d: pick(lang, "symptoms in our guide, in English and Hindi, with emergency red flags.", "लक्षण हमारी गाइड में, अंग्रेज़ी और हिंदी में, आपातकाल की चेतावनी के साथ।") },
    { n: "02", big: "100%", t: pick(lang, "Pick a verified doctor", "सत्यापित डॉक्टर चुनें"), d: pick(lang, "of listed doctors checked on the NMC register. Filter by fee, language, gender and access.", "डॉक्टर NMC रजिस्टर पर जांचे गए। फ़ीस, भाषा, लिंग और सुविधा से फ़िल्टर करें।") },
    { n: "03", big: "1 tap", t: pick(lang, "Book, and stay informed", "बुक करें, जानकारी पाते रहें"), d: pick(lang, "to rebook if your doctor goes on leave. Live updates, no phone calls.", "डॉक्टर छुट्टी पर हों तो दोबारा बुक करें। लाइव अपडेट, बिना फ़ोन किए।") },
  ];
  return (
    <section aria-labelledby="journey-title" className="bg-soft py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <TwoTone id="journey-title" first={pick(lang, "From not knowing who to see", "किसे दिखाएं, यह न जानने से")} second={pick(lang, "to the right appointment.", "सही अपॉइंटमेंट तक।")} />
        </div>
        <div className="relative mt-16">
          <div aria-hidden="true" className="absolute left-[8%] right-[8%] top-[7px] hidden h-px bg-line md:block">
            <div className="journey-fill h-full origin-left bg-accent" />
          </div>
          <ol className="grid gap-12 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="journey-step relative flex flex-col items-center text-center">
                <span aria-hidden="true" className="relative z-10 mb-8 h-4 w-4 rounded-[3px] border-2 border-ink bg-white" />
                <p className="eyebrow text-ink-2">{s.n}</p>
                <p className="mt-2 font-serif text-6xl">{s.big}</p>
                <p className="mt-3 text-lg font-medium">{s.t}</p>
                <p className="mt-1 max-w-xs text-sm text-ink-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-14 text-center">
          <Link href="/guide" className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink/85">
            {pick(lang, "See which doctor you need", "जानें कौन सा डॉक्टर चाहिए")}
          </Link>
        </div>
      </div>
    </section>
  );
}
