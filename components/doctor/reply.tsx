"use client";
// Doctor's public reply to a review (one per review, max 300 characters).
import { useState, useTransition } from "react";
import { deleteReplyAction, replyToReviewAction } from "@/lib/actions/doctor";
import { reportReviewAction } from "@/lib/actions/patient";
import { inputCls } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

export function ReplyBox({ reviewId, existing }: { reviewId: string; existing: string | null }) {
  const { toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(existing ?? "");
  const [pending, start] = useTransition();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("Fake");
  const id = `reply-${reviewId}`;

  if (!editing)
    return (
      <div className="mt-3 flex flex-wrap items-start gap-2">
        {existing && <p className="w-full rounded-xl bg-soft px-4 py-3 text-sm"><b>Your reply:</b> {existing}</p>}
        <button type="button" className={btn.secondary} onClick={() => setEditing(true)}>{existing ? "Edit reply" : "Reply"}</button>
        {existing && <button type="button" disabled={pending} className={btn.ghost} onClick={() => start(async () => { const r = await deleteReplyAction(reviewId); toast(r.message ?? "", r.ok ? "success" : "error"); setText(""); })}>Delete reply</button>}
        {!reporting ? (
          <button type="button" className={btn.ghost} onClick={() => setReporting(true)}>Report to admin</button>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <label className="sr-only" htmlFor={`rr-${reviewId}`}>Reason</label>
            <select id={`rr-${reviewId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 rounded-xl border border-[#cfc9bf] px-2">{["Abusive", "Fake", "Personal information", "Other"].map((r) => <option key={r}>{r}</option>)}</select>
            <button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => { const r = await reportReviewAction(reviewId, reason); toast(r.message ?? "", r.ok ? "success" : "error"); setReporting(false); })}>Send</button>
          </span>
        )}
      </div>
    );
  return (
    <div className="mt-3 flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">Your public reply <span className="font-normal text-ink-2">(polite, up to 300 characters)</span></label>
      <textarea id={id} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} className={`${inputCls} h-auto py-3`} />
      <p className="text-right text-xs text-ink-2">{text.length}/300</p>
      <div className="flex gap-2">
        <button type="button" disabled={pending || text.trim().length < 2} className={btn.primary} onClick={() => start(async () => { const r = await replyToReviewAction(reviewId, text); toast(r.message ?? "", r.ok ? "success" : "error"); if (r.ok) setEditing(false); })}>Post reply</button>
        <button type="button" className={btn.secondary} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  );
}
