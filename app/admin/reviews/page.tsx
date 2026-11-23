// Admin: review moderation.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Portal, ADMIN_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { AllReviews, ReportedList, type Reported, type ReviewRow } from "@/components/admin/reviews";

export const metadata = { title: "Review moderation" };

export default async function AdminReviews() {
  await requireRole(["ADMIN"], "/admin/reviews");
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { doctor: { include: { user: { select: { name: true } } } }, patient: { select: { name: true } }, reports: true },
  });
  const score = (r: (typeof reviews)[number]) => (r.waitRating + r.explanationRating + r.valueRating) / 3;
  const reported: Reported[] = reviews
    .filter((r) => r.reports.some((x) => x.status === "OPEN"))
    .map((r) => {
      const open = r.reports.filter((x) => x.status === "OPEN");
      return { id: r.id, doctor: r.doctor.user.name, patient: r.patient.name, text: r.text ?? "", score: score(r).toFixed(1), reasons: [...new Set(open.map((x) => x.reason))], count: open.length };
    });
  const rows: ReviewRow[] = reviews.map((r) => ({
    id: r.id, doctor: r.doctor.user.name, patient: r.patient.name, text: r.text ?? "", score: score(r), rating: String(Math.round(score(r))),
    date: r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), dateSort: r.createdAt.getTime(), hidden: r.isHidden,
  }));
  return (
    <Portal title="Admin" links={ADMIN_LINKS}>
      <PageTitle eyebrow="Admin" title="Review moderation" sub="Patients and doctors can report reviews. Keep them, or hide them with a reason." />
      <h2 className="mb-3 text-xl font-medium">Reported reviews ({reported.length})</h2>
      <ReportedList items={reported} />
      <h2 className="mb-3 mt-10 text-xl font-medium">All reviews</h2>
      <AllReviews rows={rows} doctors={[...new Set(rows.map((r) => r.doctor))].sort()} />
    </Portal>
  );
}
