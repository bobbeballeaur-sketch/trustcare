"use client";
// Top navigation. On the home page it starts transparent over the video and
// turns into a floating dark "pill" once you scroll (Everlab-style).
// The Emergency button is visible on every screen size.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Accessibility, Bell, Menu, Siren, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { Logo } from "./logo";
import { A11yPanel } from "./a11y-panel";
import { useApp } from "./providers";
import { t, pick } from "@/lib/i18n";
import { logoutAction } from "@/lib/actions/auth";

export type NavUser = { name: string; role: Role; unread: number };

function linksFor(user: NavUser | null, lang: "en" | "hi") {
  if (!user || user.role === "PATIENT") {
    const base = [
      { href: "/doctors", label: t(lang, "findDoctor") },
      { href: "/map", label: pick(lang, "Map", "नक्शा") },
      { href: "/guide", label: pick(lang, "Which doctor?", "कौन सा डॉक्टर?") },
    ];
    if (!user) return [...base, { href: "/hospitals", label: pick(lang, "Hospitals", "अस्पताल") }];
    return [
      ...base,
      { href: "/patient/appointments", label: t(lang, "myAppointments") },
      { href: "/messages", label: pick(lang, "Messages", "संदेश") },
      { href: "/patient/profile", label: pick(lang, "Profile", "प्रोफ़ाइल") },
    ];
  }
  if (user.role === "DOCTOR")
    return [
      { href: "/doctor", label: "Dashboard" },
      { href: "/doctor/appointments", label: "Appointments" },
      { href: "/doctor/availability", label: "Availability & leave" },
      { href: "/doctor/profile", label: "My profile" },
      { href: "/doctor/reviews", label: "Reviews" },
      { href: "/messages", label: "Messages" },
    ];
  if (user.role === "HOSPITAL")
    return [
      { href: "/hospital", label: "Hospital dashboard" },
      { href: "/hospitals", label: "All hospitals" },
      { href: "/map", label: "Map" },
    ];
  return [
    { href: "/admin", label: "Analytics" },
    { href: "/admin/doctors", label: "Verify doctors" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/specialisations", label: "Master data" },
    { href: "/security-tests", label: "Security tests" },
  ];
}

export function NavBar({ user, overlay }: { user: NavUser | null; overlay: boolean }) {
  const { lang, setLang } = useApp();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The mobile menu is open only on the page where it was opened (it closes after navigating).
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (fn: (o: boolean) => boolean) => setMenuPath(fn(menuOpen) ? pathname : null);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [liveUnread, setLiveUnread] = useState<number | null>(null);
  const unread = liveUnread ?? user?.unread ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Live unread count for the bell (checks every 8 seconds).
  useEffect(() => {
    if (!user) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/notifications/count", { cache: "no-store" });
        if (r.ok) setLiveUnread((await r.json()).unread);
      } catch {}
    }, 8000);
    return () => clearInterval(id);
  }, [user]);

  const links = linksFor(user, lang);
  const dark = overlay ? true : scrolled; // white text?
  const pill = scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <a href="#main" className="skip-link">Skip to main content</a>
      <div
        className={`mx-auto flex items-center gap-3 transition-all duration-500 ease-out ${
          pill
            ? "max-w-6xl rounded-2xl bg-night/80 px-4 py-2.5 text-white shadow-[0_10px_40px_rgba(0,0,0,.25)] backdrop-blur-xl"
            : overlay
              ? "max-w-[1400px] px-4 py-3 text-white"
              : "max-w-[1400px] rounded-2xl border border-line bg-white/90 px-4 py-2.5 text-ink backdrop-blur-xl"
        }`}
      >
        <Link href="/" className="shrink-0 rounded-lg" aria-label="TrustCare home">
          <Logo />
        </Link>

        <nav aria-label="Main" className={`mx-auto hidden items-center gap-1 ${!user || user.role === "PATIENT" ? "lg:flex" : ""}`}>
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && l.href.length > 7 && pathname.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-[0.9rem] transition-colors ${
                  active ? (dark ? "bg-white/15" : "bg-card") : dark ? "hover:bg-white/10" : "hover:bg-card"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Link
            href="/emergency"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-danger px-3.5 text-sm font-semibold text-white hover:bg-[#9a1d14]"
          >
            <Siren size={16} aria-hidden="true" />
            <span>{t(lang, "emergency")}</span>
          </Link>

          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className={`hidden h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium sm:inline-flex ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}
            aria-label={lang === "en" ? "हिंदी में बदलें (Switch to Hindi)" : "Switch to English"}
            lang={lang === "en" ? "hi" : "en"}
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setA11yOpen((o) => !o)}
              aria-expanded={a11yOpen}
              aria-controls="a11y-panel"
              aria-label={t(lang, "accessibility")}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}
            >
              <Accessibility size={20} aria-hidden="true" />
            </button>
            {a11yOpen && <A11yPanel onClose={() => setA11yOpen(false)} />}
          </div>

          {user && (
            <Link
              href="/notifications"
              aria-label={`${t(lang, "notifications")}, ${unread} ${pick(lang, "unread", "अपठित")}`}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}
            >
              <Bell size={19} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                className={`h-10 rounded-full px-3 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}
                title={`Logged in as ${user.name}`}
              >
                {t(lang, "logout")}
              </button>
            </form>
          ) : (
            <div className="hidden items-center gap-1 lg:flex">
              <Link href="/login" className={`h-10 rounded-full px-3 py-2.5 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}>
                {t(lang, "login")}
              </Link>
              <Link
                href="/signup"
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${dark ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-ink/85"}`}
              >
                {t(lang, "signup")}
              </Link>
            </div>
          )}

          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${dark ? "hover:bg-white/10" : "hover:bg-card"}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="mx-auto mt-2 max-w-6xl rounded-2xl bg-night/95 p-3 text-white shadow-xl backdrop-blur-xl lg:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl px-3 py-3 text-base hover:bg-white/10">{l.label}</Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setLang(lang === "en" ? "hi" : "en")} className="block w-full rounded-xl px-3 py-3 text-left text-base hover:bg-white/10">
                {lang === "en" ? "हिंदी में देखें" : "View in English"}
              </button>
            </li>
            <li className="mt-2 border-t border-white/15 pt-2">
              {user ? (
                <form action={logoutAction}>
                  <button type="submit" className="block w-full rounded-xl px-3 py-3 text-left text-base hover:bg-white/10">{t(lang, "logout")} ({user.name})</button>
                </form>
              ) : (
                <div className="flex gap-2 p-1">
                  <Link href="/login" className="flex-1 rounded-full border border-white/30 py-3 text-center">{t(lang, "login")}</Link>
                  <Link href="/signup" className="flex-1 rounded-full bg-white py-3 text-center font-medium text-ink">{t(lang, "signup")}</Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
