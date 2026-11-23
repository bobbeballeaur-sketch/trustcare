// Emergency page: works without logging in, reachable from every page.
import { Droplet, MapPin, Navigation, Phone, Siren } from "lucide-react";
import { db } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { Shell } from "@/components/shell";

export const metadata = { title: "Emergency" };

export default async function EmergencyPage() {
  const lang = await getLang();
  const hospitals = await db.hospital.findMany({ include: { area: true }, orderBy: [{ open24x7: "desc" }, { name: "asc" }] });
  const open = hospitals.filter((h) => h.open24x7);
  const banks = hospitals.filter((h) => h.bloodBank);
  return (
    <Shell>
      <section aria-labelledby="em-title" className="rounded-[28px] bg-danger p-6 text-white sm:p-10">
        <p className="eyebrow flex items-center gap-2 text-white/85"><Siren size={16} aria-hidden="true" /> {pick(lang, "Emergency", "आपातकाल")}</p>
        <h1 id="em-title" className="mt-3 text-[clamp(2.2rem,5vw,3.6rem)] font-medium leading-tight tracking-[-0.03em]">{pick(lang, "Need help right now? Call.", "अभी मदद चाहिए? कॉल करें।")}</h1>
        <p className="mt-2 max-w-xl text-white/90">{pick(lang, "Chest pain, trouble breathing, signs of stroke, heavy bleeding, fainting, seizure or poisoning — don't wait.", "सीने में दर्द, सांस में तकलीफ़, लकवे के लक्षण, ज़्यादा खून, बेहोशी, दौरा या ज़हर — इंतज़ार न करें।")}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href="tel:112" className="flex min-h-24 items-center gap-4 rounded-3xl bg-white p-5 text-danger hover:bg-white/90">
            <Phone size={36} aria-hidden="true" /><span><span className="block text-4xl font-semibold">112</span><span className="text-ink">{pick(lang, "National emergency number", "राष्ट्रीय आपातकालीन नंबर")}</span></span>
          </a>
          <a href="tel:108" className="flex min-h-24 items-center gap-4 rounded-3xl bg-white p-5 text-danger hover:bg-white/90">
            <Phone size={36} aria-hidden="true" /><span><span className="block text-4xl font-semibold">108</span><span className="text-ink">{pick(lang, "Ambulance", "एम्बुलेंस")}</span></span>
          </a>
        </div>
        <p className="mt-4 text-sm text-white/90">{pick(lang, "Mental health crisis: Tele-MANAS", "मानसिक स्वास्थ्य संकट: टेली-मानस")} <a href="tel:14416" className="font-semibold underline">14416</a> (24×7, free)</p>
      </section>

      <section aria-labelledby="hosp-title" className="mt-10">
        <h2 id="hosp-title" className="text-2xl font-medium">{pick(lang, "24×7 hospitals in Indore", "इंदौर के 24×7 अस्पताल")} <span className="text-base font-normal text-ink-2">(demo data)</span></h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {open.map((h) => (
            <li key={h.id} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-lg font-medium">{h.name}</p>
              <p className="mt-1 flex items-start gap-2 text-ink-2"><MapPin size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> {h.address}, {h.area.name}, Indore</p>
              <p className="mt-2 text-sm">🛏 <b>{h.bedsAvailable}</b> beds free · ICU <b>{h.icuAvailable}</b> free · Oxygen {h.oxygenAvailable ? "✓" : "✕"}</p>
              <p className="mt-2 flex flex-wrap gap-2 text-xs">
                {h.emergencyWard && <span className="rounded-md bg-danger-soft px-2 py-1 font-semibold text-danger">✓ Emergency ward</span>}
                {h.acceptsAyushman && <span className="rounded-md bg-ok-soft px-2 py-1 font-semibold text-ok">✓ Ayushman card</span>}
                {h.bloodBank && <span className="rounded-md bg-soft px-2 py-1 font-semibold">✓ Blood bank</span>}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${h.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white"><Phone size={16} aria-hidden="true" /> {pick(lang, "Call", "कॉल करें")} {h.phone}</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.address}, ${h.area.name}, Indore`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfc9bf] px-5 text-sm font-medium"><Navigation size={16} aria-hidden="true" /> {pick(lang, "Get directions", "रास्ता देखें")}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="blood-title" className="mt-10">
        <h2 id="blood-title" className="flex items-center gap-2 text-2xl font-medium"><Droplet size={22} aria-hidden="true" /> {pick(lang, "Blood banks", "ब्लड बैंक")}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {banks.map((h) => <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-soft px-5 py-4"><span>{h.name} · {h.area.name}</span><a href={`tel:${h.phone}`} className="font-semibold underline">{h.phone}</a></li>)}
        </ul>
      </section>
    </Shell>
  );
}
