// One doctor in the search results.
import Link from "next/link";
import { BadgeCheck, Check, MapPin, Star } from "lucide-react";
import { Avatar } from "../home/ui";
import { SaveButton } from "./save-button";
import { ACCESS_FEATURES } from "@/lib/validation";
import { formatDateShort, formatMinute, nowInIndia, addDays } from "@/lib/time";
import { pick, type Lang } from "@/lib/i18n";

export type CardDoctor = {
  id: string; fee: number; experienceYears: number; languages: string[]; ratingAverage: number; ratingCount: number;
  photoUrl: string | null; acceptsAyushman: boolean; offersVideo: boolean; videoFee: number | null;
  user: { name: string }; specialisation: { name: string; simpleName: string; hindiName: string }; area: { name: string; hindiName: string };
  nextSlot: { date: string; minute: number } | null; distanceKm: number | null;
} & Record<(typeof ACCESS_FEATURES)[number][0], boolean>;

function slotText(s: { date: string; minute: number } | null, lang: Lang) {
  if (!s) return pick(lang, "No free slots in the next 14 days", "अगले 14 दिन कोई स्लॉट नहीं");
  const { date } = nowInIndia();
  const day = s.date === date ? pick(lang, "Today", "आज") : s.date === addDays(date, 1) ? pick(lang, "Tomorrow", "कल") : formatDateShort(s.date);
  return `${day}, ${formatMinute(s.minute)}`;
}

export function DoctorCard({ d, lang, saved, canSave }: { d: CardDoctor; lang: Lang; saved: boolean; canSave: boolean }) {
  const features = ACCESS_FEATURES.filter(([k]) => d[k]);
  return (
    <article className="flex flex-wrap gap-5 rounded-3xl border border-line bg-white p-5 transition hover:shadow-[0_10px_40px_rgba(0,0,0,.06)]">
      <Avatar name={d.user.name} photoUrl={d.photoUrl} size={76} />
      <div className="min-w-0 flex-[1_1_300px]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">
            <Link href={`/doctors/${d.id}`} className="hover:underline">{d.user.name}</Link>
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">
            <BadgeCheck size={14} aria-hidden="true" /> {pick(lang, "Verified", "सत्यापित")}
          </span>
        </div>
        <p className="mt-0.5 text-ink-2">
          {lang === "hi" ? d.specialisation.hindiName : d.specialisation.simpleName} ({d.specialisation.name}) · {d.experienceYears} {pick(lang, "years experience", "वर्ष अनुभव")}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <li className="inline-flex items-center gap-1"><MapPin size={15} aria-hidden="true" /> {lang === "hi" ? d.area.hindiName : d.area.name}{d.distanceKm !== null && ` · ${d.distanceKm} km`}</li>
          <li>{pick(lang, "Clinic", "क्लिनिक")} ₹{d.fee}</li>
          {d.offersVideo && <li className="font-medium text-[#4b2a8a]">🎥 {pick(lang, "Video", "वीडियो")} ₹{d.videoFee ?? d.fee}</li>}
          <li>{pick(lang, "Speaks", "भाषा")} {d.languages.join(", ")}</li>
          <li className="inline-flex items-center gap-1 font-semibold">
            <Star size={15} className="fill-current" aria-hidden="true" />
            {d.ratingCount ? `${d.ratingAverage.toFixed(1)} ${pick(lang, "out of 5", "/ 5")} (${d.ratingCount} ${pick(lang, "reviews", "समीक्षाएं")})` : pick(lang, "No reviews yet", "अभी कोई समीक्षा नहीं")}
          </li>
        </ul>
        {(features.length > 0 || d.acceptsAyushman) && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Clinic features">
            {d.acceptsAyushman && <li className="inline-flex items-center gap-1 rounded-lg bg-soft px-2 py-1 text-xs"><Check size={12} aria-hidden="true" /> Ayushman card</li>}
            {features.map(([k, l]) => <li key={k} className="inline-flex items-center gap-1 rounded-lg bg-soft px-2 py-1 text-xs"><Check size={12} aria-hidden="true" /> {l}</li>)}
          </ul>
        )}
      </div>
      <div className="flex flex-[0_1_220px] flex-col justify-between gap-3">
        <p className="text-sm text-ink-2">{pick(lang, "Next available", "अगला उपलब्ध")}<br /><span className="text-base font-semibold text-ink">{slotText(d.nextSlot, lang)}</span></p>
        <div className="flex gap-2">
          <SaveButton doctorId={d.id} doctorName={d.user.name} initial={saved} canSave={canSave} />
          <Link href={`/doctors/${d.id}#book`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink/85" aria-label={`${pick(lang, "Book", "बुक करें")} ${d.user.name}`}>
            {pick(lang, "Book", "बुक करें")}
          </Link>
        </div>
      </div>
    </article>
  );
}
