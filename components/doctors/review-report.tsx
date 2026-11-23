"use client";
// "Report this review" — sends the review to the admin moderation queue.
import { useState, useTransition } from "react";
import { reportReviewAction } from "@/lib/actions/patient";
import { useApp } from "../providers";

export function ReportReview({ reviewId }: { reviewId: string }) {
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Abusive");
  const [pending, start] = useTransition();
  if (!open)
    return <button type="button" onClick={() => setOpen(true)} className="min-h-9 text-sm text-ink-2 underline underline-offset-4">Report this review</button>;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-2">Reason
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 rounded-lg border border-[#cfc9bf] px-2">
          {["Abusive", "Fake", "Personal information", "Other"].map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { const r = await reportReviewAction(reviewId, reason); toast(r.message ?? "", r.ok ? "success" : "error"); setOpen(false); })}
        className="h-10 rounded-full bg-ink px-4 text-white"
      >Send report</button>
      <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full px-3">Cancel</button>
    </div>
  );
}
