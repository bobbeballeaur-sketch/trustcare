"use client";
// Home page sections, part 2: sticky "how it works" story, the rotating
// symptom wheel, and the "all in one place" bento grid.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BadgeCheck, Bell, CalendarCheck, CalendarX, Check, Siren, Star, TriangleAlert, Users, Volume2 } from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { Photo, Reveal, TwoTone } from "./ui";
import { prefersReducedMotion } from "./smooth-scroll";

/* ---------- 5. Sticky scroll story ---------- */
export function HowItWorks() {
  const { lang } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".story-step").forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setActive(i) });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const steps = [
    { tag: pick(lang, "Guide", "गाइड"), t: pick(lang, "Not sure who to see? Start with your symptom.", "पता नहीं किसे दिखाएं? लक्षण से शुरू करें।"), d: pick(lang, "Pick who it's for and where it hurts. We suggest the type of doctor — and flag emergencies straight away. It's never a diagnosis.", "किसके लिए है और कहां तकलीफ़ है चुनें। हम डॉक्टर का प्रकार बताते हैं — और आपातकाल तुरंत पहचानते हैं। यह निदान नहीं है।") },
    { tag: pick(lang, "Verify", "जांच"), t: pick(lang, "Only doctors checked on the national register.", "सिर्फ़ राष्ट्रीय रजिस्टर पर जांचे गए डॉक्टर।"), d: pick(lang, "Each profile shows when the registration was checked, the clinic's accessibility, fees in rupees and languages spoken.", "हर प्रोफ़ाइल पर जांच की तारीख, क्लिनिक की सुविधाएं, फ़ीस और भाषाएं दिखती हैं।") },
    { tag: pick(lang, "Book", "बुक"), t: pick(lang, "Book a 15-minute slot for you or your family.", "अपने या परिवार के लिए 15 मिनट का स्लॉट बुक करें।"), d: pick(lang, "Choose Myself, Mother or Son, pick a time from a simple list, and add accessibility needs so the clinic can prepare.", "खुद, मां या बेटा चुनें, सूची से समय चुनें, और ज़रूरत बताएं ताकि क्लिनिक तैयार रहे।") },
    { tag: pick(lang, "Alerts", "सूचना"), t: pick(lang, "Your doctor on leave? You'll know first.", "डॉक्टर छुट्टी पर? आपको सबसे पहले पता चलेगा।"), d: pick(lang, "When a doctor marks leave, affected bookings are cancelled for you and you get a live notification with a Rebook button.", "डॉक्टर छुट्टी लगाएं तो बुकिंग अपने-आप रद्द होती है और दोबारा बुक करने के बटन के साथ सूचना मिलती है।") },
  ];

  const visuals = [
    <Photo key="0" tone="sand" className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink shadow-2xl">
        <p className="eyebrow text-accent-ink">{pick(lang, "Step 3 of 3", "चरण 3 / 3")}</p>
        <p className="mt-2 font-medium">{pick(lang, "Tick what applies", "जो लागू हो चुनें")}</p>
        {[pick(lang, "Rash or itching", "चकत्ते या खुजली"), pick(lang, "Hair fall", "बाल झड़ना"), pick(lang, "Acne or pimples", "मुंहासे")].map((s, i) => (
          <p key={s} className="mt-2 flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
            <span className={`flex h-5 w-5 items-center justify-center rounded ${i === 0 ? "bg-ink text-white" : "border border-ink-3"}`}>{i === 0 && <Check size={13} aria-hidden="true" />}</span>{s}
          </p>
        ))}
        <p className="mt-4 rounded-lg bg-soft p-3 text-sm">{pick(lang, "You may want to see a", "आप दिखा सकते हैं")} <b>{pick(lang, "Skin doctor (Dermatologist)", "त्वचा डॉक्टर (Dermatologist)")}</b></p>
      </div>
    </Photo>,
    <Photo key="1" tone="clay" className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7c2a2] font-semibold">AM</span>
          <div>
            <p className="font-medium">Dr. Anjali Mehta</p>
            <p className="text-sm text-ink-2">{pick(lang, "Skin doctor (Dermatologist)", "त्वचा डॉक्टर")}</p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm font-medium text-ok"><BadgeCheck size={16} aria-hidden="true" /> {pick(lang, "Registration checked 12 Nov 2026", "रजिस्ट्रेशन 12 नवंबर 2026 को जांचा")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {["₹500", "Hindi, English", pick(lang, "Wheelchair ramp", "व्हीलचेयर रैंप"), pick(lang, "Evenings", "शाम")].map((x) => <span key={x} className="rounded-md bg-soft px-2 py-1">{x}</span>)}
        </div>
      </div>
    </Photo>,
    <Photo key="2" tone="olive" className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink shadow-2xl">
        <p className="text-sm font-medium">{pick(lang, "Who is this visit for?", "विज़िट किसके लिए है?")}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {[pick(lang, "Myself", "खुद"), pick(lang, "Mother (Kamla)", "मां (कमला)"), pick(lang, "Son (Aarav)", "बेटा (आरव)")].map((x, i) => <span key={x} className={`rounded-lg px-3 py-2 ${i === 1 ? "bg-ink text-white" : "border border-line"}`}>{x}</span>)}
        </div>
        <p className="mt-4 text-sm font-medium">{pick(lang, "Wednesday 25 November", "बुधवार 25 नवंबर")}</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          {["10:00", "10:15", "10:30", "10:45", "11:00", "11:15"].map((x, i) => (
            <span key={x} className={`rounded-lg px-2 py-2 text-center ${i === 1 ? "bg-soft text-ink-3 line-through" : i === 2 ? "bg-ink text-white" : "border border-line"}`}>{x}{i === 1 && <span className="sr-only"> booked</span>}</span>
          ))}
        </div>
      </div>
    </Photo>,
    <Photo key="3" tone="rose" className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <div className="rounded-2xl bg-white p-4 text-ink shadow-2xl">
          <p className="flex items-center gap-2 text-sm font-medium"><CalendarX size={16} className="text-warn" aria-hidden="true" /> {pick(lang, "Dr. Sunil Verma is on leave tomorrow", "डॉ. सुनील वर्मा कल छुट्टी पर हैं")}</p>
          <p className="mt-1 text-sm text-ink-2">{pick(lang, "Your 10:15 am visit was cancelled.", "आपकी 10:15 की विज़िट रद्द हुई।")}</p>
          <span className="mt-3 inline-flex rounded-full bg-ink px-4 py-2 text-xs font-medium text-white">{pick(lang, "Rebook", "दोबारा बुक करें")}</span>
        </div>
        <div className="ml-8 rounded-2xl bg-white/90 p-4 text-ink shadow-xl">
          <p className="flex items-center gap-2 text-sm font-medium"><CalendarCheck size={16} className="text-ok" aria-hidden="true" /> {pick(lang, "Appointment confirmed", "अपॉइंटमेंट पक्की")}</p>
        </div>
      </div>
    </Photo>,
  ];

  return (
    <section aria-labelledby="how-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <TwoTone id="how-title" first={pick(lang, "This is how", "ऐसे काम करता है")} second={pick(lang, "TrustCare works.", "TrustCare.")} />
          <p className="mt-4 text-ink-2">{pick(lang, "Four simple steps, designed with elderly, low-vision and Hindi-speaking users from day one.", "चार आसान कदम, बुज़ुर्ग, कम देखने वाले और हिंदी भाषी लोगों के लिए बनाए गए।")}</p>
        </div>
        <div ref={ref} className="mt-16 grid gap-10 md:grid-cols-[1fr_1.15fr]">
          <ol>
            {steps.map((s, i) => (
              <li key={s.tag} className="story-step flex min-h-[60vh] flex-col justify-center py-8">
                <p className={`eyebrow flex items-center gap-2 transition-colors ${active === i ? "text-ink" : "text-ink-3"}`}>
                  <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" /> {s.tag}
                </p>
                <h3 className={`mt-3 text-2xl font-medium tracking-tight transition-colors md:text-3xl ${active === i ? "text-ink" : "text-ink-3"}`}>{s.t}</h3>
                <p className="mt-3 max-w-md text-ink-2">{s.d}</p>
                <div className="mt-6 aspect-[4/3.4] overflow-hidden rounded-3xl md:hidden">{visuals[i]}</div>
              </li>
            ))}
          </ol>
          <div className="hidden md:block">
            <div className="sticky top-24 aspect-[4/4.4] overflow-hidden rounded-3xl bg-soft" aria-hidden="true">
              {visuals.map((v, i) => (
                <div key={i} className={`absolute inset-0 transition-all duration-700 ${active === i ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}>{v}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Black section with a rotating wheel of symptoms ---------- */
export function SymptomWheel({ symptoms }: { symptoms: { en: string; hi: string; emergency: boolean }[] }) {
  const { lang } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(".wheel", { rotate: -40 }, { rotate: 60, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    }, ref);
    return () => ctx.revert();
  }, []);
  const words = symptoms.slice(0, 48);
  return (
    <section ref={ref} aria-labelledby="wheel-title" className="relative overflow-hidden bg-black py-28 text-white md:py-40">
      <div aria-hidden="true" className="wheel absolute left-[-520px] top-1/2 h-[1040px] w-[1040px] -translate-y-1/2 md:left-[-380px]">
        {words.map((w, i) => {
          const angle = (360 / words.length) * i;
          return (
            <span
              key={i}
              className={`absolute left-1/2 top-1/2 origin-left whitespace-nowrap pl-[400px] text-sm ${w.emergency ? "font-medium text-accent" : "text-white/55"}`}
              style={{ transform: `rotate(${angle}deg)` }}
            >
              {w.emergency && "▲ "}
              {lang === "hi" ? w.hi : w.en}
            </span>
          );
        })}
      </div>
      <Reveal className="relative mx-auto flex max-w-6xl justify-end px-5">
        <div className="max-w-md rounded-3xl bg-black/60 p-2 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <div data-reveal>
            <TwoTone id="wheel-title" dark first={pick(lang, "Make sense of 60+ symptoms,", "60+ लक्षण समझें,")} second={pick(lang, "in English and Hindi.", "अंग्रेज़ी और हिंदी में।")} />
          </div>
          <p data-reveal className="mt-5 text-white/75">
            {pick(lang, "Symptoms marked ▲ are red flags. If you tick one, we skip the doctor list and show emergency numbers and the nearest 24×7 hospitals.", "▲ वाले लक्षण खतरे के संकेत हैं। इन्हें चुनने पर हम सीधे आपातकाल नंबर और नज़दीकी 24×7 अस्पताल दिखाते हैं।")}
          </p>
          <div data-reveal className="mt-7 flex flex-wrap gap-3">
            <Link href="/guide" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-white/90">{pick(lang, "Try the guide", "गाइड आज़माएं")}</Link>
            <Link href="/emergency" className="inline-flex items-center gap-2 rounded-full border border-white/35 px-5 py-3 text-sm font-medium hover:bg-white/10"><Siren size={16} aria-hidden="true" /> {pick(lang, "Emergency help", "आपातकालीन मदद")}</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 7. Bento grid: everything in one place ---------- */
export function Bento() {
  const { lang } = useApp();
  return (
    <section aria-labelledby="bento-title" className="py-24 md:py-32">
      <Reveal className="mx-auto max-w-6xl px-5">
        <div data-reveal className="max-w-xl">
          <TwoTone id="bento-title" first={pick(lang, "Take charge, stay informed,", "ज़िम्मेदारी लें, जानकारी पाएं,")} second={pick(lang, "all in one place.", "सब एक जगह।")} />
          <p className="mt-4 text-ink-2">{pick(lang, "Appointments for the whole family, live updates and verified reviews — without a single phone call.", "पूरे परिवार की अपॉइंटमेंट, लाइव अपडेट और सत्यापित समीक्षाएं — बिना फ़ोन किए।")}</p>
          <Link href="/signup" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink/85">{pick(lang, "Create a free account", "मुफ़्त खाता बनाएं")}</Link>
        </div>

        <div className="mt-12 grid auto-rows-[260px] gap-3 md:grid-cols-3">
          <Photo tone="clay" className="rounded-3xl p-6 text-white md:row-span-1" >
            <div data-reveal className="flex h-full flex-col justify-between">
              <Star size={28} aria-hidden="true" />
              <div>
                <p className="font-serif text-7xl leading-none">4.6</p>
                <p className="mt-2 text-sm text-white/85">{pick(lang, "out of 5 · 38 verified-visit reviews", "5 में से · 38 सत्यापित समीक्षाएं")}</p>
              </div>
              <p className="text-sm font-medium">{pick(lang, "Know who you're seeing", "जानें किसे दिखा रहे हैं")}</p>
            </div>
          </Photo>

          <div data-reveal className="flex flex-col justify-between rounded-3xl bg-soft p-6">
            <div>
              <p className="text-sm text-ink-2">{pick(lang, "Wait time", "इंतज़ार")}</p>
              <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 w-[86%] rounded-full bg-ink" /></div>
              <p className="mt-3 text-sm text-ink-2">{pick(lang, "Explains clearly", "साफ़ समझाते हैं")}</p>
              <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 w-[96%] rounded-full bg-ink" /></div>
              <p className="mt-3 text-sm text-ink-2">{pick(lang, "Value for money", "पैसे की कीमत")}</p>
              <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 w-[92%] rounded-full bg-ink" /></div>
            </div>
            <p className="text-sm font-medium">{pick(lang, "Ratings in three honest parts", "तीन हिस्सों में ईमानदार रेटिंग")}</p>
          </div>

          <Photo tone="sand" className="rounded-3xl p-6">
            <div data-reveal className="flex h-full flex-col justify-between">
              <div className="space-y-2">
                <p className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow"><CalendarCheck size={15} className="text-ok" aria-hidden="true" /> {pick(lang, "Appointment confirmed", "अपॉइंटमेंट पक्की")}</p>
                <p className="ml-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow"><TriangleAlert size={15} className="text-warn" aria-hidden="true" /> {pick(lang, "Doctor on leave — Rebook", "डॉक्टर छुट्टी पर — दोबारा बुक करें")}</p>
                <p className="ml-8 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow"><Bell size={15} aria-hidden="true" /> {pick(lang, "How was your visit?", "विज़िट कैसी रही?")}</p>
              </div>
              <p className="text-sm font-medium text-ink">{pick(lang, "Live updates, no refreshing", "लाइव अपडेट")}</p>
            </div>
          </Photo>

          <Photo tone="olive" className="rounded-3xl p-6 text-white md:col-span-2">
            <div data-reveal className="flex h-full flex-col justify-between">
              <Users size={28} aria-hidden="true" />
              <div className="flex flex-wrap gap-2">
                {[pick(lang, "Myself", "खुद"), pick(lang, "Mother · Kamla, 68 · wheelchair user", "मां · कमला, 68 · व्हीलचेयर"), pick(lang, "Son · Aarav, 10", "बेटा · आरव, 10")].map((x) => (
                  <span key={x} className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">{x}</span>
                ))}
              </div>
              <p className="text-sm font-medium">{pick(lang, "Book for your whole family from one account", "एक खाते से पूरे परिवार के लिए बुक करें")}</p>
            </div>
          </Photo>

          <div data-reveal className="flex flex-col justify-between rounded-3xl bg-ink p-6 text-white">
            <div className="flex flex-wrap gap-2">
              {["A−", "A", "A+"].map((x, i) => <span key={x} className={`flex h-11 w-11 items-center justify-center rounded-xl ${i === 2 ? "bg-white text-ink" : "border border-white/30"}`}>{x}</span>)}
              <span className="flex h-11 items-center gap-2 rounded-xl border border-white/30 px-3 text-sm"><Volume2 size={15} aria-hidden="true" /> {pick(lang, "Listen", "सुनें")}</span>
            </div>
            <p className="text-sm font-medium">{pick(lang, "Bigger text, high contrast, read-aloud and voice", "बड़ा टेक्स्ट, हाई कंट्रास्ट, पढ़कर सुनाना और आवाज़")}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
