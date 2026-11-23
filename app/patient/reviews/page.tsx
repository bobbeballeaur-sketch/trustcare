// My reviews: edit or delete your own reviews.
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDateLong } from "@/lib/time";
import { Shell, PageTitle, EmptyState } from "@/components/shell";
import { ReviewRowActions } from "@/components/patient/my-reviews";

export const metadata = { title: "My reviews" };

export default async function MyReviews() {
  const user = await requireRole(["PATIENT"], "/patient/reviews");
  const reviews = await db.review.findMany({
    where: { patientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { doctor: { include: { user: { select: { name: true } } } }, appointment: { select: { date: true } } },
  });
  return (
    <Shell>
      <PageTitle eyebrow="Patient" title="My reviews" sub="You can review a doctor after a completed visit. Edit or delete your reviews any time." />
      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" text="After a completed visit, you'll see a Write review button in your past appointments." href="/patient/appointments?tab=past" cta="Past appointments" />
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-3xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium"><Link href={`/doctors/${r.doctorId}`} className="hover:underline">{r.doctor.user.name}</Link></p>
                  <p className="text-sm text-ink-2">Visit on {formatDateLong(r.appointment.date)} · Wait {r.waitRating}/5 · Explained {r.explanationRating}/5 · Value {r.valueRating}/5</p>
                </div>
                <ReviewRowActions review={{ id: r.id, waitRating: r.waitRating, explanationRating: r.explanationRating, valueRating: r.valueRating, text: r.text }} doctorName={r.doctor.user.name} />
              </div>
              {r.text && <p className="mt-3">{r.text}</p>}
              {r.isHidden && <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">⚠ Hidden by our moderators: {r.hiddenReason}</p>}
              {r.doctorReply && <p className="mt-3 rounded-xl bg-soft px-4 py-3 text-sm"><b>Doctor&apos;s reply:</b> {r.doctorReply}</p>}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
