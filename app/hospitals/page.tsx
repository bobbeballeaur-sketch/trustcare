// Public list of hospitals with live beds, ICU, oxygen and blood stock.
import Link from "next/link";
import { MapPin, Navigation, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { Shell, PageTitle } from "@/components/shell";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata = { title: "Hospitals in Indore" };

export default async function HospitalsPage() {
  const lang = await getLang();
  const hospitals = await db.hospital.findMany({ include: { area: true }, orderBy: [{ open24x7: "desc" }, { bedsAvailable: "desc" }] });
  return (
    <Shell>
      <AutoRefresh every={15000} />
      <PageTitle eyebrow={pick(lang, "Live availability", "लाइव उपलब्धता")} title={pick(lang, "Hospitals in Indore", "इंदौर के अस्पताल")} sub={pick(lang, "Beds, ICU, oxygen and blood stock are updated by each hospital. (Demo data.)", "बेड, ICU, ऑक्सीजन और ब्लड स्टॉक अस्पताल खुद अपडेट करते हैं। (डेमो डेटा)")}>
        <Link href="/map" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">{pick(lang, "See on map", "नक्शे पर देखें")}</Link>
      </PageTitle>
      <ul className="grid gap-3 md:grid-cols-2">
        {hospitals.map((h) => (
          <li key={h.id} id={`h-${h.id}`} className="scroll-mt-28 rounded-3xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-medium">{h.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${h.open24x7 ? "bg-ok-soft text-ok" : "bg-soft"}`}>{h.open24x7 ? "✓ Open 24×7" : "Day hours"}</span>
            </div>
            <p className="mt-1 flex gap-2 text-sm text-ink-2"><MapPin size={16} className="shrink-0" aria-hidden="true" /> {h.address}, {h.area.name}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-soft p-3"><dt className="text-xs text-ink-2">Free beds</dt><dd className="font-serif text-3xl">{h.bedsAvailable}</dd></div>
              <div className="rounded-2xl bg-soft p-3"><dt className="text-xs text-ink-2">Free ICU</dt><dd className="font-serif text-3xl">{h.icuAvailable}</dd></div>
              <div className="rounded-2xl bg-soft p-3"><dt className="text-xs text-ink-2">Oxygen</dt><dd className="mt-2 font-semibold">{h.oxygenAvailable ? "✓ Yes" : "✕ No"}</dd></div>
            </dl>
            <p className="mt-3 text-sm"><b>Blood stock:</b> {h.bloodGroups.length ? h.bloodGroups.join(", ") : "none listed"}</p>
            {h.specialities.length > 0 && <p className="mt-1 text-sm text-ink-2">{h.specialities.join(" · ")}</p>}
            <p className="mt-1 text-xs text-ink-2">Updated {h.updatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${h.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white"><Phone size={16} aria-hidden="true" /> {h.phone}</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfc9bf] px-5 text-sm font-medium"><Navigation size={16} aria-hidden="true" /> Directions</a>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
