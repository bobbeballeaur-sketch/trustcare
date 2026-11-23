// My appointments: Upcoming, Past and Cancelled tabs, with live updates.
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { MapPin, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { addDays, formatDateLong, formatMinute, nowInIndia } from "@/lib/time";
import { Shell, PageTitle, StatusBadge, EmptyState } from "@/components/shell";
import { AutoRefresh } from "@/components/auto-refresh";
import { UpcomingActions, WriteReview, RebookButton } from "@/components/patient/appointment-actions";
import { ModeBadge, PayBadge } from "@/components/consult/badges";

export const metadata = { title: "My appointments" };

type SP = { tab?: string; q?: string; from?: string; to?: string };

export default async function MyAppointments({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireRole(["PATIENT"], "/patient/appointments");
  const lang = await getLang();
  const sp = await searchParams;
  const tab = sp.tab === "past" || sp.tab === "cancelled" ? sp.tab : "upcoming";
  const { date: today } = nowInIndia();

  const where: Prisma.AppointmentWhereInput = { patientId: user.id };
  if (tab === "upcoming") Object.assign(where, { status: { in: ["REQUESTED", "CONFIRMED"] }, date: { gte: today } });
  if (tab === "cancelled") Object.assign(where, { status: { in: ["CANCELLED", "DECLINED"] } });
  if (tab === "past") {
    Object.assign(where, { OR: [{ status: { in: ["COMPLETED", "NO_SHOW"] } }, { status: { in: ["REQUESTED", "CONFIRMED"] }, date: { lt: today } }] });
    const and: Prisma.AppointmentWhereInput[] = [];
    if (sp.q) and.push({ OR: [{ doctor: { user: { name: { contains: sp.q, mode: "insensitive" } } } }, { doctor: { specialisation: { simpleName: { contains: sp.q, mode: "insensitive" } } } }, { doctor: { specialisation: { name: { contains: sp.q, mode: "insensitive" } } } }] });
    if (sp.from) and.push({ date: { gte: sp.from } });
    if (sp.to) and.push({ date: { lte: sp.to } });
    if (and.length) where.AND = and;
  }

  const appts = await db.appointment.findMany({
    where,
    orderBy: tab === "upcoming" ? [{ date: "asc" }, { startMinute: "asc" }] : [{ date: "desc" }, { startMinute: "desc" }],
    include: { doctor: { include: { user: { select: { name: true } }, specialisation: true } }, familyMember: true, review: { select: { id: true } } },
  });

  const tabs = [
    ["upcoming", pick(lang, "Upcoming", "आने वाली")],
    ["past", pick(lang, "Past", "पिछली")],
    ["cancelled", pick(lang, "Cancelled", "रद्द")],
  ];

  return (
    <Shell>
      <AutoRefresh />
      <PageTitle eyebrow={pick(lang, "Patient", "मरीज़")} title={pick(lang, "My appointments", "मेरी अपॉइंटमेंट")} sub={pick(lang, "Updates appear here live — no need to refresh.", "अपडेट यहां अपने-आप दिखते हैं।")}>
        <Link href="/doctors" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-ink/85">{pick(lang, "Book a new visit", "नई विज़िट बुक करें")}</Link>
      </PageTitle>

      <nav aria-label="Appointment tabs" className="mb-6 flex gap-1 rounded-full bg-soft p-1 sm:w-fit">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`/patient/appointments?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`flex-1 rounded-full px-5 py-2.5 text-center text-sm font-medium sm:flex-none ${tab === k ? "bg-white shadow" : "text-ink-2 hover:text-ink"}`}>{l}</Link>
        ))}
      </nav>

      {tab === "past" && (
        <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4" role="search" aria-label="Search past appointments">
          <input type="hidden" name="tab" value="past" />
          <label className="flex flex-[1_1_220px] flex-col gap-1 text-sm font-medium">Doctor or specialisation
            <input name="q" defaultValue={sp.q} className="h-11 rounded-xl border border-[#cfc9bf] px-3 font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">From
            <input type="date" name="from" defaultValue={sp.from} max={today} className="h-11 rounded-xl border border-[#cfc9bf] px-3 font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">To
            <input type="date" name="to" defaultValue={sp.to} max={today} className="h-11 rounded-xl border border-[#cfc9bf] px-3 font-normal" />
          </label>
          <button className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-white">Search</button>
          {(sp.q || sp.from || sp.to) && <Link href="/patient/appointments?tab=past" className="h-11 rounded-full px-4 py-3 text-sm underline">Clear</Link>}
        </form>
      )}

      {appts.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? pick(lang, "No appointments yet", "अभी कोई अपॉइंटमेंट नहीं") : pick(lang, "Nothing here", "यहां कुछ नहीं")}
          text={tab === "upcoming" ? pick(lang, "Find a verified doctor and book a 15-minute slot.", "सत्यापित डॉक्टर खोजें और स्लॉट बुक करें।") : undefined}
          href={tab === "upcoming" ? "/doctors" : undefined}
          cta={pick(lang, "Find a doctor", "डॉक्टर खोजें")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {appts.map((a) => {
            const canReview = a.status === "COMPLETED" && !a.review && a.date >= addDays(today, -30);
            return (
              <li key={a.id} className="rounded-3xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium"><Link href={`/doctors/${a.doctorId}`} className="hover:underline">{a.doctor.user.name}</Link></p>
                    <p className="text-sm text-ink-2">{a.doctor.specialisation.simpleName} ({a.doctor.specialisation.name})</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5"><StatusBadge status={a.status} /><ModeBadge mode={a.mode} /><PayBadge status={a.paymentStatus} fee={a.fee} /></div>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                  <div><dt className="sr-only">When</dt><dd className="font-semibold">{formatDateLong(a.date)}, {formatMinute(a.startMinute)}</dd></div>
                  <div className="flex items-center gap-1.5"><dt><UserRound size={15} aria-label="Patient" /></dt><dd>{a.familyMember ? `${a.familyMember.name} (${a.familyMember.relationship})` : pick(lang, "Myself", "खुद")}</dd></div>
                  <div className="flex items-center gap-1.5"><dt><MapPin size={15} aria-label="Clinic" /></dt><dd className="truncate">{a.doctor.clinicName}, {a.doctor.clinicAddress}</dd></div>
                </dl>
                {a.cancelReason && <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">Reason: {a.cancelReason}{a.cancelledBy ? ` · by ${a.cancelledBy.toLowerCase()}` : ""}</p>}
                {a.status === "REQUESTED" && <p className="mt-3 text-sm text-warn">⏳ Waiting for the doctor to confirm.</p>}
                <div className="mt-4 flex flex-col gap-3">
                  {tab !== "cancelled" && (
                    <div className="flex flex-wrap gap-2">
                      {tab === "upcoming" && a.paymentStatus === "UNPAID" && <Link href={`/pay/${a.id}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">💳 Pay ₹{a.fee}</Link>}
                      {a.mode === "VIDEO" && a.status === "CONFIRMED" && a.paymentStatus === "PAID" && <Link href={`/consult/${a.id}`} className="inline-flex min-h-11 items-center rounded-full bg-[#4b2a8a] px-5 text-sm font-medium text-white">🎥 Join video call</Link>}
                      <Link href={`/messages/${a.id}`} className="inline-flex min-h-11 items-center rounded-full border border-[#cfc9bf] px-5 text-sm font-medium">💬 Chat with doctor</Link>
                    </div>
                  )}
                  {tab === "upcoming" && (
                    <UpcomingActions a={{ id: a.id, doctorId: a.doctorId, doctorName: a.doctor.user.name, date: a.date, startMinute: a.startMinute, clinic: `${a.doctor.clinicName}, ${a.doctor.clinicAddress}` }} />
                  )}
                  {tab === "past" && canReview && <WriteReview appointmentId={a.id} doctorName={a.doctor.user.name} />}
                  {tab === "past" && a.review && <Link href="/patient/reviews" className="text-sm underline underline-offset-4">✓ Reviewed — edit in My reviews</Link>}
                  {tab === "cancelled" && <RebookButton doctorId={a.doctorId} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}
