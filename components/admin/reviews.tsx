"use client";
// Review moderation: reported reviews (Keep / Hide) and all reviews.
import { moderateReviewAction } from "@/lib/actions/admin";
import { DataTable, type Column } from "./data-table";
import { ActionButton, ReasonButton } from "./reason-button";

export type Reported = { id: string; doctor: string; patient: string; text: string; score: string; reasons: string[]; count: number };
export type ReviewRow = { id: string; doctor: string; patient: string; text: string; score: number; date: string; dateSort: number; hidden: boolean; rating: string };

export function ReportedList({ items }: { items: Reported[] }) {
  if (!items.length) return <p className="rounded-3xl border border-dashed border-line bg-soft p-8 text-center text-ink-2">No open reports.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-3xl border-2 border-warn/40 bg-white p-5">
          <p className="text-sm text-ink-2">Review of <b className="text-ink">{r.doctor}</b> by {r.patient} · {r.score} out of 5</p>
          <p className="mt-2 rounded-xl bg-soft p-3">“{r.text}”</p>
          <p className="mt-2 text-sm"><b>{r.count} report{r.count > 1 ? "s" : ""}:</b> {r.reasons.join(", ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton label="Keep (dismiss report)" variant="secondary" run={() => moderateReviewAction(r.id, "keep")} />
            <ReasonButton label="Hide review" title="Hide this review?" confirmLabel="Hide" variant="danger" run={(reason) => moderateReviewAction(r.id, "hide", reason)} help="Hidden reviews disappear from the profile and stop counting towards the rating." />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AllReviews({ rows, doctors }: { rows: ReviewRow[]; doctors: string[] }) {
  const columns: Column<ReviewRow>[] = [
    { key: "date", header: "Date", sortValue: (r) => r.dateSort, render: (r) => r.date },
    { key: "doctor", header: "Doctor", sortValue: (r) => r.doctor, render: (r) => r.doctor },
    { key: "patient", header: "Patient", sortValue: (r) => r.patient, render: (r) => r.patient },
    { key: "score", header: "Rating", sortValue: (r) => r.score, render: (r) => `${r.score.toFixed(1)} / 5` },
    { key: "text", header: "Review", render: (r) => <span className="line-clamp-2 max-w-sm">{r.text || "—"}</span> },
    { key: "hidden", header: "Visible", sortValue: (r) => (r.hidden ? 1 : 0), render: (r) => (r.hidden ? "⊘ Hidden" : "✓ Visible") },
  ];
  return (
    <DataTable
      caption="All reviews"
      rows={rows}
      columns={columns}
      searchText={(r) => `${r.doctor} ${r.patient} ${r.text}`}
      filters={[
        { key: "doctor", label: "Doctor", options: doctors, value: (r) => r.doctor },
        { key: "rating", label: "Rating", options: ["5", "4", "3", "2", "1"], value: (r) => r.rating },
      ]}
    />
  );
}
