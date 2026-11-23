// Admin analytics dashboard.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, formatDateShort, nowInIndia } from "@/lib/time";
import { ACCESS_FEATURES } from "@/lib/validation";
import { Portal, ADMIN_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { Stat } from "@/components/doctor/stat";
import { DailyLine, HBar } from "@/components/charts";

export const metadata = { title: "Admin analytics" };

export default async function AdminHome() {
  await requireRole(["ADMIN"], "/admin");
  const { date: today } = nowInIndia();
  const since = addDays(today, -29);
  const monthStart = today.slice(0, 8) + "01";
  const [patients, docStatus, monthAppts, outcomes, daily, searches, specs, areas, verifiedDocs, openReports, ratings] = await Promise.all([
    db.user.count({ where: { role: "PATIENT" } }),
    db.doctorProfile.groupBy({ by: ["verificationStatus"], _count: true }),
    db.appointment.count({ where: { date: { gte: monthStart } } }),
    db.appointment.findMany({ where: { date: { gte: since, lte: today } }, select: { status: true, cancelledBy: true } }),
    db.appointment.groupBy({ by: ["date"], where: { date: { gte: since, lte: today } }, _count: true }),
    db.searchEvent.groupBy({ by: ["specialisationId"], where: { specialisationId: { not: null } }, _count: true }),
    db.specialisation.findMany(),
    db.area.findMany({ include: { doctors: { where: { verificationStatus: "VERIFIED" }, select: { id: true } } } }),
    db.doctorProfile.findMany({ where: { verificationStatus: "VERIFIED" } }),
    db.reviewReport.count({ where: { status: "OPEN" } }),
    db.doctorProfile.aggregate({ where: { verificationStatus: "VERIFIED", ratingCount: { gt: 0 } }, _avg: { ratingAverage: true } }),
  ]);
  const count = (s: string) => docStatus.find((d) => d.verificationStatus === s)?._count ?? 0;
  const finished = outcomes.filter((o) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(o.status));
  const pct = (n: number) => (finished.length ? Math.round((n / finished.length) * 100) : 0);
  const completed = outcomes.filter((o) => o.status === "COMPLETED").length;
  const cancelled = outcomes.filter((o) => o.status === "CANCELLED").length;

  const byDay = new Map(daily.map((d) => [d.date, d._count]));
  const line = Array.from({ length: 30 }, (_, i) => { const d = addDays(since, i); return { day: formatDateShort(d).slice(4), count: byDay.get(d) ?? 0 }; });
  const specName = new Map(specs.map((s) => [s.id, s.simpleName]));
  const searched = searches.map((s) => ({ name: specName.get(s.specialisationId!) ?? "Other", value: s._count })).sort((a, b) => b.value - a.value).slice(0, 8);
  const perArea = areas.map((a) => ({ name: a.name, value: a.doctors.length })).sort((a, b) => b.value - a.value);
  const outcomeBars = [
    { name: "Completed", value: completed },
    { name: "Cancelled by patient", value: outcomes.filter((o) => o.status === "CANCELLED" && o.cancelledBy === "PATIENT").length },
    { name: "Cancelled — doctor leave", value: outcomes.filter((o) => o.status === "CANCELLED" && o.cancelledBy === "SYSTEM").length },
    { name: "Cancelled by doctor", value: outcomes.filter((o) => o.status === "CANCELLED" && o.cancelledBy === "DOCTOR").length },
    { name: "No-show", value: outcomes.filter((o) => o.status === "NO_SHOW").length },
  ];
  const access = ACCESS_FEATURES.map(([k, l]) => ({ name: l, value: Math.round((verifiedDocs.filter((d) => d[k]).length / Math.max(1, verifiedDocs.length)) * 100) }));
  const card = "rounded-3xl border border-line bg-white p-6";
  const lowest = perArea[perArea.length - 1];

  return (
    <Portal title="Admin" links={ADMIN_LINKS}>
      <PageTitle eyebrow="Admin" title="Analytics" sub="Live numbers from the database (demo data)." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Patients" value={patients} />
        <Stat label="Doctors" value={count("VERIFIED")} note={`${count("PENDING")} pending · ${count("REJECTED") + count("REVOKED")} rejected`} />
        <Stat label="Appointments this month" value={monthAppts} />
        <Stat label="Completion rate (30 days)" value={`${pct(completed)}%`} note={`Cancellation rate ${pct(cancelled)}%`} />
        <Stat label="Average doctor rating" value={(ratings._avg.ratingAverage ?? 0).toFixed(1)} note="out of 5" />
        <Stat label="Reviews reported" value={openReports} note="waiting for moderation" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={`${card} xl:col-span-2`} aria-labelledby="c1"><h2 id="c1" className="mb-4 text-lg font-medium">Appointments per day · last 30 days</h2><DailyLine data={line} label={`Appointments per day over the last 30 days, ${line.reduce((s, x) => s + x.count, 0)} in total`} /></section>
        <section className={card} aria-labelledby="c2"><h2 id="c2" className="mb-4 text-lg font-medium">Most searched specialisations</h2><HBar data={searched} label="Most searched specialisations" /></section>
        <section className={card} aria-labelledby="c3">
          <h2 id="c3" className="text-lg font-medium">Doctors per area of Indore</h2>
          <p className="mb-4 text-sm text-ink-2">Underserved: <b className="text-accent-ink">{lowest?.name}</b> has only {lowest?.value} verified doctor{lowest?.value === 1 ? "" : "s"} (highlighted).</p>
          <HBar data={perArea} label="Verified doctors per area" highlightLow />
        </section>
        <section className={card} aria-labelledby="c4"><h2 id="c4" className="mb-4 text-lg font-medium">Appointment outcomes · last 30 days</h2><HBar data={outcomeBars} label="Appointment outcomes" /></section>
        <section className={card} aria-labelledby="c5"><h2 id="c5" className="mb-4 text-lg font-medium">Doctors offering each accessibility feature</h2><HBar data={access} label="Share of verified doctors offering each accessibility feature" suffix="%" /></section>
      </div>
    </Portal>
  );
}
