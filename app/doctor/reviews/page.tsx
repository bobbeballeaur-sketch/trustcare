// Doctor: all reviews with search, sorting and a rating filter; reply to each.
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireVerifiedDoctor } from "@/lib/doctor-guard";
import { Portal, DOCTOR_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { ReplyBox } from "@/components/doctor/reply";

export const metadata = { title: "Reviews" };

export default async function DoctorReviews({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; min?: string }> }) {
  const { doctorId } = await requireVerifiedDoctor("/doctor/reviews");
  const sp = await searchParams;
  const where: Prisma.ReviewWhereInput = { doctorId, isHidden: false };
  if (sp.q) where.text = { contains: sp.q, mode: "insensitive" };
  let reviews = await db.review.findMany({ where, orderBy: { createdAt: "desc" }, include: { patient: { select: { name: true } } } });
  const score = (r: (typeof reviews)[number]) => (r.waitRating + r.explanationRating + r.valueRating) / 3;
  const min = Number(sp.min) || 0;
  if (min) reviews = reviews.filter((r) => Math.round(score(r)) === min);
  if (sp.sort === "lowest") reviews.sort((a, b) => score(a) - score(b));
  if (sp.sort === "highest") reviews.sort((a, b) => score(b) - score(a));
  const input = "h-11 rounded-xl border border-[#cfc9bf] bg-white px-3 text-sm font-normal";
  return (
    <Portal title="Doctor portal" links={DOCTOR_LINKS}>
      <PageTitle eyebrow="Doctor portal" title="Reviews" sub="You can reply politely to any review. You can't delete patients' reviews, but you can report them to the admin." />
      <form role="search" aria-label="Filter reviews" className="mb-5 flex flex-wrap items-end gap-3 rounded-3xl border border-line bg-white p-4">
        <label className="flex flex-[1_1_200px] flex-col gap-1 text-sm font-medium">Search text<input name="q" defaultValue={sp.q} className={input} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Rating<select name="min" defaultValue={sp.min ?? ""} className={input}><option value="">All</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Sort<select name="sort" defaultValue={sp.sort ?? "newest"} className={input}><option value="newest">Newest</option><option value="highest">Highest</option><option value="lowest">Lowest</option></select></label>
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-white">Apply</button>
        <Link href="/doctor/reviews" className="h-11 px-3 py-3 text-sm underline">Clear</Link>
      </form>
      <p role="status" className="mb-3 text-sm text-ink-2">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
      <ul className="flex flex-col gap-3">
        {reviews.map((r) => (
          <li key={r.id} id={`r-${r.id}`} className="scroll-mt-28 rounded-3xl border border-line bg-white p-5">
            <p className="text-sm text-ink-2">{r.patient.name} · {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · <b className="text-ink">{score(r).toFixed(1)} out of 5</b> (wait {r.waitRating}, explained {r.explanationRating}, value {r.valueRating})</p>
            <p className="mt-2">{r.text ?? <span className="text-ink-2">(ratings only)</span>}</p>
            <ReplyBox reviewId={r.id} existing={r.doctorReply} />
          </li>
        ))}
      </ul>
    </Portal>
  );
}
