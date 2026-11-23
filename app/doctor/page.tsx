// Doctor home: the verification status screen for pending/rejected doctors,
// otherwise the dashboard (stats, today's schedule, 30-day chart, latest reviews).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Hourglass, ShieldX } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, formatDateShort, formatMinute, nowInIndia } from "@/lib/time";
import { Portal, DOCTOR_LINKS } from "@/components/portal";
import { Shell, PageTitle, StatusBadge } from "@/components/shell";
import { Stat } from "@/components/doctor/stat";
import { DailyLine } from "@/components/charts";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata = { title: "Doctor dashboard" };

export default async function DoctorHome() {
  const user = await requireRole(["DOCTOR"], "/doctor");
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/doctor/register");

  if (profile.verificationStatus !== "VERIFIED") {
    const rejected = profile.verificationStatus === "REJECTED" || profile.verificationStatus === "REVOKED";
    return (
      <Shell>
        <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 text-center">
          {rejected ? <ShieldX size={40} className="mx-auto text-danger" aria-hidden="true" /> : <Hourglass size={40} className="mx-auto text-warn" aria-hidden="true" />}
          <h1 className="mt-4 text-3xl font-medium tracking-tight">
            {rejected ? (profile.verificationStatus === "REVOKED" ? "Your verification was revoked" : "Your registration was not approved") : "Your registration is being verified"}
          </h1>
          {rejected ? (
            <>
              <p className="mt-3 rounded-2xl bg-danger-soft p-4 text-left text-danger"><b>Reason:</b> {profile.rejectionReason}</p>
              <Link href="/doctor/register" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-medium text-white">Edit and resubmit</Link>
            </>
          ) : (
            <p className="mt-3 text-ink-2">Our team is checking registration <b className="text-ink">{profile.registrationNumber}</b> ({profile.stateMedicalCouncil}, {profile.registrationYear}) on the NMC Indian Medical Register. You&apos;ll get a notification as soon as it&apos;s done. Until then you won&apos;t appear in search.</p>
          )}
        </div>
      </Shell>
    );
  }

  const { date: today } = nowInIndia();
  const weekEnd = addDays(today, 6);
  const since = addDays(today, -29);
  const [todays, pending, weekConfirmed, last30, latest] = await Promise.all([
    db.appointment.findMany({ where: { doctorId: profile.id, date: today, status: { in: ["REQUESTED", "CONFIRMED", "COMPLETED", "NO_SHOW"] } }, orderBy: { startMinute: "asc" }, include: { patient: { select: { name: true } }, familyMember: true } }),
    db.appointment.count({ where: { doctorId: profile.id, status: "REQUESTED", date: { gte: today } } }),
    db.appointment.count({ where: { doctorId: profile.id, status: "CONFIRMED", date: { gte: today, lte: weekEnd } } }),
    db.appointment.groupBy({ by: ["date"], where: { doctorId: profile.id, date: { gte: since, lte: today } }, _count: true }),
    db.review.findMany({ where: { doctorId: profile.id, isHidden: false }, orderBy: { createdAt: "desc" }, take: 3, include: { patient: { select: { name: true } } } }),
  ]);
  const byDay = new Map(last30.map((r) => [r.date, r._count]));
  const chart = Array.from({ length: 30 }, (_, i) => { const d = addDays(since, i); return { day: formatDateShort(d).slice(4), count: byDay.get(d) ?? 0 }; });
  const total30 = chart.reduce((s, c) => s + c.count, 0);

  return (
    <Portal title="Doctor portal" links={DOCTOR_LINKS}>
      <AutoRefresh every={8000} />
      <PageTitle eyebrow="Doctor portal" title={`Welcome, ${user.name}`} sub="Your profile is verified and visible in search.">
        <Link href="/doctor/appointments" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Manage appointments</Link>
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Today's appointments" value={todays.length} />
        <Stat label="Pending requests" value={pending} note={pending ? "Need your reply" : "All caught up"} />
        <Stat label="Confirmed this week" value={weekConfirmed} />
        <Stat label="Average rating" value={profile.ratingAverage.toFixed(1)} note="out of 5" />
        <Stat label="Reviews" value={profile.ratingCount} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section aria-labelledby="today-h" className="rounded-3xl border border-line bg-white p-6">
          <h2 id="today-h" className="text-lg font-medium">Today&apos;s schedule</h2>
          {todays.length === 0 ? <p className="mt-3 text-ink-2">No appointments today.</p> : (
            <ol className="mt-4 border-l-2 border-line">
              {todays.map((a) => (
                <li key={a.id} className="relative flex flex-wrap items-center gap-3 py-3 pl-5">
                  <span aria-hidden="true" className="absolute -left-[7px] h-3 w-3 rounded-full bg-ink" />
                  <span className="w-20 font-semibold">{formatMinute(a.startMinute)}</span>
                  <span className="flex-1">{a.familyMember ? `${a.familyMember.name} (via ${a.patient.name})` : a.patient.name}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="chart-h" className="rounded-3xl border border-line bg-white p-6">
          <h2 id="chart-h" className="text-lg font-medium">Appointments per day · last 30 days</h2>
          <p className="mb-3 text-sm text-ink-2">{total30} in total</p>
          <DailyLine data={chart} label={`Line chart of appointments per day over the last 30 days, ${total30} in total.`} />
        </section>
      </div>
      <section aria-labelledby="rev-h" className="mt-6 rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center justify-between"><h2 id="rev-h" className="text-lg font-medium">Latest reviews</h2><Link href="/doctor/reviews" className="text-sm underline underline-offset-4">All reviews</Link></div>
        <ul className="mt-3 divide-y divide-line">
          {latest.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-2">{r.patient.name} · {((r.waitRating + r.explanationRating + r.valueRating) / 3).toFixed(1)} out of 5</p>
                <p className="mt-1">{r.text ?? "(no text)"}</p>
              </div>
              <Link href={`/doctor/reviews#r-${r.id}`} className="rounded-full border border-[#cfc9bf] px-4 py-2 text-sm font-medium">{r.doctorReply ? "Edit reply" : "Reply"}</Link>
            </li>
          ))}
        </ul>
      </section>
    </Portal>
  );
}
