// Dark footer shown on every public page.
import Link from "next/link";
import { Logo } from "./logo";
import { getLang } from "@/lib/lang";
import { pick, t } from "@/lib/i18n";

export async function SiteFooter() {
  const lang = await getLang();
  return (
    <footer className="bg-night text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-10 pt-16 md:grid-cols-[1.1fr_1fr] md:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_120%_at_10%_0%,#e8622c_0%,#8a2f10_45%,#2a120a_100%)] p-8 md:p-10">
          <p className="font-serif text-4xl leading-tight md:text-5xl">
            {pick(lang, "The right doctor,", "सही डॉक्टर,")}
            <br />
            <span className="text-white/70">{pick(lang, "verified, in your language.", "सत्यापित, आपकी भाषा में।")}</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/doctors" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-white/90">
              {t(lang, "findDoctor")}
            </Link>
            <Link href="/guide" className="rounded-full border border-white/40 px-5 py-3 text-sm font-medium hover:bg-white/10">
              {t(lang, "guide")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="mb-3 font-serif text-lg">{pick(lang, "Explore", "देखें")}</p>
            <ul className="space-y-2 text-white/75">
              <li><Link className="hover:text-white" href="/doctors">{t(lang, "findDoctor")}</Link></li>
              <li><Link className="hover:text-white" href="/guide">{t(lang, "guide")}</Link></li>
              <li><Link className="hover:text-white" href="/signup?role=doctor">{pick(lang, "Doctors: join TrustCare", "डॉक्टर: जुड़ें")}</Link></li>
              <li><Link className="hover:text-white" href="/login">{t(lang, "login")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-lg">{pick(lang, "Emergency", "आपातकाल")}</p>
            <ul className="space-y-2 text-white/75">
              <li><a className="hover:text-white" href="tel:112">112 · {pick(lang, "National emergency", "राष्ट्रीय आपातकाल")}</a></li>
              <li><a className="hover:text-white" href="tel:108">108 · {pick(lang, "Ambulance", "एम्बुलेंस")}</a></li>
              <li><a className="hover:text-white" href="tel:14416">14416 · Tele-MANAS</a></li>
              <li><Link className="hover:text-white" href="/emergency">{pick(lang, "24×7 hospitals", "24×7 अस्पताल")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-lg">{pick(lang, "About", "जानकारी")}</p>
            <ul className="space-y-2 text-white/75">
              <li><Link className="hover:text-white" href="/accessibility">{pick(lang, "Accessibility statement", "सुलभता विवरण")}</Link></li>
              <li><Link className="hover:text-white" href="/#verified">{pick(lang, "How we verify doctors", "हम कैसे जांचते हैं")}</Link></li>
              <li><Link className="hover:text-white" href="/security-tests">{pick(lang, "Security tests (demo)", "सुरक्षा परीक्षण (डेमो)")}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-xs text-white/70 md:px-10">
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>© 2026 trustcare · Web Development project, IIM Indore</span>
          <span className="font-semibold text-white">{t(lang, "demoData")}</span>
          <span>{t(lang, "noAdvice")}</span>
          <span>Hero video: Mixkit (free licence)</span>
        </p>
        <Logo className="text-white/90" />
      </div>
    </footer>
  );
}
