"use client";
// Small building blocks shared by the home page sections.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./smooth-scroll";

/** Two-tone heading: first line black, second line grey (Everlab-style). */
export function TwoTone({
  first,
  second,
  as: Tag = "h2",
  id,
  className = "",
  dark = false,
}: {
  first: string;
  second: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <Tag id={id} className={`text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.035em] ${className}`}>
      <span className="block">{first}</span>
      <span className={`block ${dark ? "text-white/60" : "text-ink-2"}`}>{second}</span>
    </Tag>
  );
}

/** Fades and lifts every child marked data-reveal as it scrolls into view. */
export function Reveal({ children, className = "", stagger = 0.08 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const items = ref.current!.querySelectorAll("[data-reveal]");
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 80%" },
      });
    }, ref);
    return () => ctx.revert();
  }, [stagger]);
  return <div ref={ref} className={className}>{children}</div>;
}

/** A warm, photo-like gradient tile used where a real photo would go. */
export function Photo({ tone = "clay", className = "", children }: { tone?: "clay" | "amber" | "olive" | "sand" | "slate" | "rose"; className?: string; children?: React.ReactNode }) {
  const tones: Record<string, string> = {
    clay: "bg-[radial-gradient(120%_90%_at_20%_10%,#f2a36b_0%,#c4561f_40%,#5a230c_100%)]",
    amber: "bg-[radial-gradient(120%_90%_at_80%_0%,#ffd49a_0%,#d98a3a_45%,#6b3a16_100%)]",
    olive: "bg-[radial-gradient(120%_90%_at_30%_0%,#b9b98a_0%,#62623d_50%,#23251a_100%)]",
    sand: "bg-[radial-gradient(120%_90%_at_70%_10%,#fbf3e6_0%,#e6d3b7_50%,#b49a78_100%)]",
    slate: "bg-[radial-gradient(120%_90%_at_20%_0%,#d9e1e6_0%,#8fa3ad_50%,#3d4c55_100%)]",
    rose: "bg-[radial-gradient(120%_90%_at_60%_0%,#f6c6b5_0%,#c66b55_50%,#5d241b_100%)]",
  };
  return <div className={`relative overflow-hidden ${tones[tone]} ${className}`}>{children}</div>;
}

/** Round avatar with a photo, or initials on a warm background. */
export function Avatar({ name, photoUrl, size = 48 }: { name: string; photoUrl?: string | null; size?: number }) {
  const initials = name.replace(/^Dr\.?\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const hues = ["#e7c2a2", "#d5b48f", "#c9d3c0", "#e5cfc4", "#d6cbb8", "#c7d0d6"];
  const bg = hues[name.length % hues.length];
  if (photoUrl)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={`Photo of ${name}`} width={size} height={size} className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  return (
    <span
      role="img"
      aria-label={`Photo placeholder for ${name}`}
      className="flex shrink-0 items-center justify-center rounded-xl font-semibold text-ink/80"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
}
