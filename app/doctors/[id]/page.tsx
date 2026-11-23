// Doctor profile: verified badge, clinic details, accessibility, ratings,
// reviews and the booking panel.
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, MapPin, Navigation, Phone, Star, X } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { ACCESS_FEATURES } from "@/lib/validation";
import { dayName, formatMinute, generateSlots, nowInIndia } from "@/lib/time";
import { Shell } from "@/components/shell";
import { Avatar } from "@/components/home/ui";
import { SaveButton } from "@/components/doctors/save-button";
import { Booking } from "@/components/doctors/booking";
import { ReportReview } from "@/components/doctors/review-report";
import { ListenButton } from "@/components/listen-button";

export default async function DoctorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reviews?: string }> }) {
  const { id } = await params;
  const { reviews: reviewSort = "newest" } = await searchParams;
  const [lang, user] = await Promise.all([getLang(), getCurrentUser()]);
  const { date: today } = nowInIndia();

  const d = await db.doctorProfile.findUnique({
    where: { id },
    include: { user: true, specialisation: true, area: true, availability: true, leaves: { where: { toDate: { gte: today } } } },
  });
  // SECURITY: unverified or suspended doctors have no public profile.
  if (!d || d.verificationStatus !== "VERIFIED" || d.user.status !== "ACTIVE") notFound();

  const orderBy =
    reviewSort === "highest" ? [{ waitRating: "desc" as const }, { createdAt: "desc" as const }]
    : reviewSort === "lowest" ? [{ waitRating: "asc" as const }, { createdAt: "desc" as const }]
    : [{ createdAt: "desc" as const }];
  const [reviews, taken, family, saved] = await Promise.all([
    db.review.findMany({ where: { doctorId: id, isHidden: false }, orderBy, include: { patient: { select: { name: true } } } }),
    db.appointment.findMany({ where: { doctorId: id, date: { gte: today }, status: { in: ["REQUESTED", "CONFIRMED"] } }, select: { date: true, startMinute: true } }),
    user?.role === "PATIENT" ? db.familyMember.findMany({ where: { patientId: user.id }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    user?.role === "PATIENT" ? db.savedDoctor.findUnique({ where: { patientId_doctorId: { patientId: user.id, doctorId: id } } }) : Promise.resolve(null),
  ]);
  const days = generateSlots(d.availability, d.leaves, taken);
  const avg = (k: "waitRating" | "explanationRating" | "valueRating") => (reviews.length ? reviews.reduce((s, r) => s + r[k], 0) / reviews.length : 0);
  const parts = [
    { label: pick(lang, "Wait time", "इंतज़ार"), v: avg("waitRating") },
    { label: pick(lang, "Explains clearly", "साफ़ समझाते हैं"), v: avg("explanationRating") },
    { label: pick(lang, "Value for money", "पैसे की कीमत"), v: avg("valueRating") },
  ];
  const hours = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    dow,
    blocks: d.availability.filter((b) => b.dayOfWeek === dow).sort((a, b) => a.startMinute - b.startMinute),
  }));
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.clinicName}, ${d.clinicAddress}`)}`;
  const mode = !user ? "guest" : user.role === "PATIENT" ? "patient" : "other";
  const btnLine = "inline-flex h-11 items-center gap-2 rounded-full border border-[#cfc9bf] bg-white px-4 text-sm font-medium hover:bg-soft";

  return (
    <Shell wide>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-2">
        <Link href="/doctors" className="underline underline-offset-4">{pick(lang, "Find a doctor", "डॉक्टर खोजें")}</Link> ›{" "}
        <Link href={`/doctors?spec=${d.specialisation.slug}`} className="underline underline-offset-4">{d.specialisation.simpleName}s</Link> › {d.user.name}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div id="profile" className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-wrap gap-6 rounded-3xl border border-line bg-white p-6">
            <Avatar name={d.user.name} photoUrl={d.photoUrl} size={112} />
            <div className="min-w-0 flex-[1_1_320px]">
              <h1 className="text-[clamp(2rem,3.5vw,2.8rem)] font-medium leading-tight tracking-[-0.03em]">{d.user.name}</h1>
              <p className="mt-1 text-lg">{lang === "hi" ? d.specialisation.hindiName : d.specialisation.simpleName} <span className="text-ink-2">({d.specialisation.name})</span> · {d.qualifications}</p>
              <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-ok-soft px-3 py-2 text-sm font-medium text-ok">
                <BadgeCheck size={18} className="shrink-0" aria-hidden="true" />
                {pick(lang, "Verified — registration checked on the NMC Indian Medical Register on", "सत्यापित — NMC इंडियन मेडिकल रजिस्टर पर जांचा गया:")} {d.verifiedAt?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem]">
                <li>{d.experienceYears} {pick(lang, "years experience", "वर्ष अनुभव")}</li>
                <li>{d.gender}</li>
                <li>{pick(lang, "Speaks", "भाषा")} {d.languages.join(", ")}</li>
                <li className="inline-flex items-center gap-1 font-semibold"><Star size={16} className="fill-current" aria-hidden="true" />{d.ratingCount ? `${d.ratingAverage.toFixed(1)} out of 5 stars, ${d.ratingCount} reviews` : "No reviews yet"}</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#book" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink/85">{pick(lang, "Book appointment", "अपॉइंटमेंट बुक करें")}</a>
                <a href={`tel:+91${d.clinicPhone}`} className={btnLine}><Phone size={17} aria-hidden="true" /> {pick(lang, "Call clinic", "क्लिनिक को कॉल करें")}</a>
                <SaveButton doctorId={d.id} doctorName={d.user.name} initial={!!saved} canSave={user?.role === "PATIENT"} withText />
                <ListenButton targetId="profile" className={btnLine} />
              </div>
            </div>
          </section>

          <section aria-labelledby="about-h" className="rounded-3xl border border-line bg-white p-6">
            <h2 id="about-h" className="text-xl font-medium">{pick(lang, "About", "परिचय")}</h2>
            <p className="mt-2 text-ink-2">{d.bio}</p>
          </section>

          <section aria-labelledby="clinic-h" className="rounded-3xl border border-line bg-white p-6">
            <h2 id="clinic-h" className="text-xl font-medium">{pick(lang, "Clinic", "क्लिनिक")}</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-medium">{d.clinicName}</p>
                <p className="mt-1 flex gap-2 text-ink-2"><MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {d.clinicAddress}</p>
                <a href={maps} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
                  <Navigation size={16} aria-hidden="true" /> {pick(lang, "Get directions (opens Google Maps)", "रास्ता देखें (Google Maps)")}
                </a>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-ink-2">{pick(lang, "Clinic fee", "क्लिनिक शुल्क")}</dt><dd className="font-semibold">₹{d.fee}</dd>
                  <dt className="text-ink-2">{pick(lang, "Video consult", "वीडियो परामर्श")}</dt><dd>{d.offersVideo ? <b>₹{d.videoFee ?? d.fee} · online from home</b> : pick(lang, "Not offered", "उपलब्ध नहीं")}</dd>
                  <dt className="text-ink-2">Ayushman card</dt><dd>{d.acceptsAyushman ? pick(lang, "Accepted", "स्वीकार") : pick(lang, "Not accepted", "स्वीकार नहीं")}</dd>
                  <dt className="text-ink-2">{pick(lang, "Phone", "फ़ोन")}</dt><dd>{d.clinicPhone}</dd>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-semibold">{pick(lang, "Timings", "समय")}</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {hours.map((h) => (
                    <div key={h.dow} className="contents">
                      <dt className="text-ink-2">{dayName(h.dow)}</dt>
                      <dd>{h.blocks.length ? h.blocks.map((b) => `${formatMinute(b.startMinute)} – ${formatMinute(b.endMinute)}`).join(", ") : "Closed"}</dd>
                    </div>
                  ))}
                </dl>
                {d.leaves.length > 0 && (
                  <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">⚠ {pick(lang, "On leave", "छुट्टी पर")}: {d.leaves.map((l) => (l.fromDate === l.toDate ? l.fromDate : `${l.fromDate} to ${l.toDate}`)).join(", ")}</p>
                )}
              </div>
            </div>
            <h3 className="mt-6 text-sm font-semibold">{pick(lang, "Accessibility at this clinic", "क्लिनिक में सुविधाएं")}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {ACCESS_FEATURES.map(([k, l]) => (
                <li key={k} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${d[k] ? "bg-ok-soft text-ok" : "bg-soft text-ink-2"}`}>
                  {d[k] ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
                  {d[k] ? l : `No ${l.toLowerCase()}`}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="rev-h" className="rounded-3xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="rev-h" className="text-xl font-medium">{pick(lang, "Ratings and reviews", "रेटिंग और समीक्षाएं")}</h2>
              <nav aria-label="Sort reviews" className="flex gap-1 text-sm">
                {[["newest", "Newest"], ["highest", "Highest"], ["lowest", "Lowest"]].map(([v, l]) => (
                  <Link key={v} href={`/doctors/${id}?reviews=${v}#rev-h`} aria-current={reviewSort === v ? "true" : undefined} className={`rounded-full px-3 py-2 ${reviewSort === v ? "bg-ink text-white" : "hover:bg-soft"}`}>{l}</Link>
                ))}
              </nav>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-8">
              <p><span className="font-serif text-6xl">{d.ratingAverage.toFixed(1)}</span><span className="block text-sm text-ink-2">out of 5 · {d.ratingCount} reviews</span></p>
              <div className="flex min-w-[260px] flex-1 flex-col gap-2">
                {parts.map((p) => (
                  <div key={p.label} className="flex items-center gap-3 text-sm">
                    <span className="w-36">{p.label}</span>
                    <span aria-hidden="true" className="h-2 flex-1 rounded-full bg-line"><span className="block h-2 rounded-full bg-ink" style={{ width: `${(p.v / 5) * 100}%` }} /></span>
                    <span className="w-24 text-right font-semibold">{p.v.toFixed(1)} out of 5</span>
                  </div>
                ))}
              </div>
            </div>
            <ul className="mt-6 divide-y divide-line">
              {reviews.length === 0 && <li className="py-4 text-ink-2">No reviews yet. Reviews come only from completed visits.</li>}
              {reviews.slice(0, 20).map((r) => (
                <li key={r.id} className="py-5">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <b>{r.patient.name.split(" ")[0]} {r.patient.name.split(" ")[1]?.[0]}.</b>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok"><Check size={12} aria-hidden="true" /> Verified visit</span>
                    <span className="text-sm text-ink-2">{r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {((r.waitRating + r.explanationRating + r.valueRating) / 3).toFixed(1)} out of 5</span>
                  </p>
                  {r.text && <p className="mt-2">{r.text}</p>}
                  {r.doctorReply && <p className="mt-3 rounded-xl bg-soft px-4 py-3 text-sm"><b>Reply from {d.user.name}:</b> {r.doctorReply}</p>}
                  {user?.role === "PATIENT" && user.id !== r.patientId && <div className="mt-2"><ReportReview reviewId={r.id} /></div>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside id="book" aria-labelledby="book-h" className="h-fit scroll-mt-28 rounded-3xl border-2 border-ink bg-white p-6 lg:sticky lg:top-24">
          <h2 id="book-h" className="mb-5 text-xl font-medium">{pick(lang, "Book an appointment", "अपॉइंटमेंट बुक करें")}</h2>
          <Booking
            doctorId={d.id}
            doctorName={d.user.name}
            days={days}
            family={family.map((f) => ({ id: f.id, name: f.name, relationship: f.relationship, accessibilityNeeds: f.accessibilityNeeds }))}
            mode={mode}
            offersVideo={d.offersVideo}
            clinicFee={d.fee}
            videoFee={d.videoFee}
          />
          <p className="mt-4 text-xs text-ink-2">{pick(lang, "15-minute slots for the next 14 days, India time.", "अगले 14 दिनों के 15 मिनट के स्लॉट, भारतीय समय।")}</p>
        </aside>
      </div>
    </Shell>
  );
}
