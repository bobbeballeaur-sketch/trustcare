"use client";
// Home hero: an intro wordmark animation, then a full-screen rounded video
// panel with the headline rising in word by word (Everlab-style).
// If no video file is present, a slow-moving warm gradient is shown instead.
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { BadgeCheck, Star, Zap } from "lucide-react";
import { SearchBox } from "../search-box";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";
import { prefersReducedMotion } from "./smooth-scroll";

export function Hero({ areas }: { areas: { name: string; hindiName: string }[] }) {
  const { lang } = useApp();
  const root = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set(".intro-cover", { display: "none" });
        return;
      }
      // The wordmark intro plays once per browser session; afterwards only the headline animates.
      let seen = false;
      try { seen = sessionStorage.getItem("tc_intro") === "1"; sessionStorage.setItem("tc_intro", "1"); } catch {}
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (seen) gsap.set(".intro-cover", { display: "none" });
      else
        tl.from(".intro-word", { yPercent: 110, duration: 0.9, ease: "power4.out" })
          .to(".intro-word", { opacity: 0, filter: "blur(8px)", scale: 1.08, duration: 0.6, delay: 0.35 })
          .to(".intro-cover", { autoAlpha: 0, duration: 0.6 }, "<0.15");
      tl.from(".hero-panel", { scale: 1.06, duration: 1.4 }, seen ? 0 : "<")
        .from(".hero-line > span", { yPercent: 100, opacity: 0, stagger: 0.08, duration: 1 }, "<0.25")
        .from(".hero-fade", { y: 24, opacity: 0, stagger: 0.12, duration: 0.9 }, "<0.4");
    }, root);
    return () => ctx.revert();
  }, []);

  const line1 = pick(lang, "Find the right doctor.", "सही डॉक्टर खोजें।").split(" ");
  const line2 = pick(lang, "Verified, in your language.", "सत्यापित, आपकी भाषा में।").split(" ");

  return (
    <div ref={root} className="relative">
      {/* Intro: big wordmark on black, then it fades away */}
      <div aria-hidden="true" className="intro-cover hc-hide fixed inset-0 z-[70] flex items-center justify-center bg-night">
        <div className="overflow-hidden">
          <p className="intro-word text-[clamp(3.5rem,12vw,10rem)] font-medium tracking-[-0.05em] text-white">trustcare</p>
        </div>
      </div>

      <section aria-labelledby="hero-title" className="p-2 sm:p-3">
        <div className="hero-panel relative isolate flex min-h-[calc(100svh-16px)] flex-col overflow-hidden rounded-[28px] bg-night text-white sm:min-h-[calc(100svh-24px)]">
          {/* Fallback background: warm moving glow */}
          <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
            <div className="absolute -left-1/4 top-[-20%] h-[90%] w-[80%] rounded-full bg-[#c2551f] opacity-50 blur-[120px] [animation:drift_18s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-30%] right-[-10%] h-[90%] w-[70%] rounded-full bg-[#6b3a22] opacity-60 blur-[120px] [animation:drift_22s_ease-in-out_infinite_reverse]" />
            <div className="absolute left-1/3 top-1/3 h-[50%] w-[40%] rounded-full bg-[#e7b27a] opacity-20 blur-[100px] [animation:drift_26s_ease-in-out_infinite]" />
          </div>
          {/* Background video (public/media/hero.mp4). Decorative, so muted and hidden from screen readers. */}
          <video
            aria-hidden="true"
            className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/media/hero-poster.jpg"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src="/media/hero.mp4" type="video/mp4" />
          </video>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />

          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 pb-10 pt-28 text-center">
            <p className="hero-fade eyebrow mb-6 inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {pick(lang, "Indore · Only verified doctors", "इंदौर · सिर्फ़ सत्यापित डॉक्टर")}
            </p>
            <h1 id="hero-title" className="font-serif text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.98] tracking-[-0.01em]">
              <span className="hero-line block overflow-hidden pb-1">
                {line1.map((w, i) => (<span key={i} className="inline-block">{w}&nbsp;</span>))}
              </span>
              <span className="hero-line block overflow-hidden pb-2 text-white/75">
                {line2.map((w, i) => (<span key={i} className="inline-block">{w}&nbsp;</span>))}
              </span>
            </h1>
            <p className="hero-fade mt-5 max-w-xl text-base text-white/85 sm:text-lg">
              {pick(
                lang,
                "Every doctor checked on the National Medical Register. Every review from a real visit. And if your doctor goes on leave, you hear first.",
                "हर डॉक्टर नेशनल मेडिकल रजिस्टर पर जांचा गया। हर समीक्षा असली विज़िट से। और डॉक्टर छुट्टी पर हों, तो आपको सबसे पहले पता चले।",
              )}
            </p>
            <div className="hero-fade mt-8 w-full max-w-3xl">
              <SearchBox areas={areas} />
            </div>
          </div>

          <ul className="hero-fade eyebrow flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 pb-6 text-white/85">
            <li className="flex items-center gap-2"><BadgeCheck size={15} aria-hidden="true" /> {pick(lang, "NMC-verified doctors", "NMC-सत्यापित डॉक्टर")}</li>
            <li className="flex items-center gap-2"><Star size={15} aria-hidden="true" /> {pick(lang, "Reviews from real visits", "असली विज़िट से समीक्षाएं")}</li>
            <li className="flex items-center gap-2"><Zap size={15} aria-hidden="true" /> {pick(lang, "Instant leave alerts", "छुट्टी की तुरंत सूचना")}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
