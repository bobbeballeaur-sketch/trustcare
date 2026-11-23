"use client";
// Home page sections, part 3: doctor grid, testimonials carousel, final call to action.
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Hospital, MapPinned, Quote, Star, Video } from "lucide-react";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { Avatar, Photo, Reveal, TwoTone } from "./ui";

type Doc = { id: string; name: string; photoUrl: string | null; spec: string; specHi: string; area: string };

export function DoctorsGrid({ doctors }: { doctors: Doc[] }) {
  const { lang } = useApp();
  return (
    <section aria-labelledby="docs-title" className="bg-soft py-24 md:py-32">
      <Reveal className="mx-auto max-w-6xl px-5">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <TwoTone id="docs-title" first={pick(lang, "Real doctors behind", "हर बुकिंग के पीछे")} second={pick(lang, "every booking.", "असली डॉक्टर।")} />
            <p className="mt-4 text-ink-2">{pick(lang, "Every doctor below has a registration number we checked by hand. (Demo data: these doctors are fictional.)", "नीचे हर डॉक्टर का रजिस्ट्रेशन नंबर हमने जांचा है। (डेमो डेटा: ये डॉक्टर काल्पनिक हैं।)")}</p>
          </div>
          <Link href="/doctors" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-ink/85">
            {pick(lang, "See all doctors", "सभी डॉक्टर देखें")} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <li data-reveal key={d.id}>
              <Link href={`/doctors/${d.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg">
                <Avatar name={d.name} photoUrl={d.photoUrl} size={56} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.name}</span>
                  <span className="block truncate text-sm text-ink-2">{lang === "hi" ? d.specHi : d.spec} · {d.area}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

type Story = { name: string; text: string; rating: number; doctor: string };

export function Testimonials({ stories }: { stories: Story[] }) {
  const { lang } = useApp();
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  const tones = ["sand", "clay", "olive", "rose", "amber", "slate"] as const;
  return (
    <section aria-labelledby="stories-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <TwoTone id="stories-title" first={pick(lang, "What families", "परिवार क्या")} second={pick(lang, "in Indore say.", "कहते हैं।")} />
        <p className="mt-4 text-ink-2">{pick(lang, "Every review comes from a completed visit. (Demo data.)", "हर समीक्षा पूरी हुई विज़िट से आती है। (डेमो डेटा)")}</p>
      </div>
      <ul ref={track} tabIndex={0} aria-label={pick(lang, "Patient stories, scroll sideways", "मरीज़ों की कहानियां")} className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:px-[max(20px,calc((100vw-1150px)/2))]">
        {stories.map((s, i) =>
          i % 3 === 1 ? (
            <li key={i} className="w-[300px] shrink-0 snap-start sm:w-[340px]">
              <Photo tone={tones[i % tones.length]} className="flex h-[420px] flex-col justify-end rounded-3xl p-6 text-white">
                <Quote size={36} aria-hidden="true" className="mb-auto opacity-80" />
                <p className="text-lg leading-snug">“{s.text}”</p>
                <p className="mt-4 text-sm text-white/85">{s.name} · {pick(lang, "visited", "मिले")} {s.doctor}</p>
              </Photo>
            </li>
          ) : (
            <li key={i} className="flex h-[420px] w-[300px] shrink-0 snap-start flex-col rounded-3xl bg-soft p-6 sm:w-[340px]">
              <p className="flex gap-0.5 text-ink" role="img" aria-label={`${s.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => <Star key={k} size={16} fill={k < s.rating ? "currentColor" : "none"} aria-hidden="true" />)}
              </p>
              <p className="mt-5 text-lg font-medium leading-snug">“{s.text}”</p>
              <p className="mt-auto flex items-center gap-3 text-sm">
                <Avatar name={s.name} size={36} />
                <span><span className="block font-medium">{s.name}</span><span className="text-ink-2">{pick(lang, "Visited", "मिले")} {s.doctor}</span></span>
              </p>
            </li>
          ),
        )}
      </ul>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={() => scroll(-1)} aria-label={pick(lang, "Previous stories", "पिछली कहानियां")} className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:bg-soft"><ChevronLeft size={18} aria-hidden="true" /></button>
        <button type="button" onClick={() => scroll(1)} aria-label={pick(lang, "Next stories", "अगली कहानियां")} className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:bg-soft"><ChevronRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { lang } = useApp();
  return (
    <section aria-labelledby="final-title" className="px-2 pb-2 sm:px-3 sm:pb-3">
      <Photo tone="amber" className="flex min-h-[70vh] items-center justify-center rounded-[28px] px-5 text-center text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,.18)_45%,transparent_60%)] [animation:drift_14s_ease-in-out_infinite]" />
        <Reveal className="relative">
          <h2 data-reveal id="final-title" className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-none">
            {pick(lang, "The right doctor is one search away.", "सही डॉक्टर बस एक खोज दूर।")}
          </h2>
          <div data-reveal className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/doctors" className="rounded-full bg-white px-6 py-3 text-sm font-medium text-ink hover:bg-white/90">{pick(lang, "Find a doctor", "डॉक्टर खोजें")}</Link>
            <Link href="/signup" className="rounded-full border border-white/50 px-6 py-3 text-sm font-medium hover:bg-white/10">{pick(lang, "Create an account", "खाता बनाएं")}</Link>
          </div>
        </Reveal>
      </Photo>
    </section>
  );
}

/* Practo-style quick services row, right under the hero. */
export function Services() {
  const { lang } = useApp();
  const items = [
    { href: "/map", Icon: MapPinned, tone: "clay" as const, t: pick(lang, "Doctors near you", "आपके पास के डॉक्टर"), d: pick(lang, "Explore Indore on the map", "इंदौर को नक्शे पर देखें") },
    { href: "/doctors?video=1", Icon: Video, tone: "olive" as const, t: pick(lang, "Video consult", "वीडियो परामर्श"), d: pick(lang, "See a doctor from home", "घर बैठे डॉक्टर से मिलें") },
    { href: "/hospitals", Icon: Hospital, tone: "rose" as const, t: pick(lang, "Hospitals & beds", "अस्पताल और बेड"), d: pick(lang, "Live beds, ICU and blood stock", "लाइव बेड, ICU और ब्लड") },
    { href: "/guide", Icon: Compass, tone: "amber" as const, t: pick(lang, "Which doctor?", "कौन सा डॉक्टर?"), d: pick(lang, "3 quick questions", "3 आसान सवाल") },
  ];
  return (
    <section aria-label={pick(lang, "Services", "सेवाएं")} className="mx-auto max-w-[1400px] px-2 pt-3 sm:px-3">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ href, Icon, tone, t, d }) => (
          <li key={href}>
            <Link href={href} className="group block overflow-hidden rounded-3xl bg-soft transition hover:-translate-y-0.5 hover:shadow-lg">
              <Photo tone={tone} className="flex h-36 items-center justify-center">
                <Icon size={46} strokeWidth={1.4} className="text-white transition group-hover:scale-110" aria-hidden="true" />
              </Photo>
              <span className="flex items-center justify-between gap-2 p-4">
                <span><span className="block text-lg font-medium">{t}</span><span className="text-sm text-ink-2">{d}</span></span>
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
