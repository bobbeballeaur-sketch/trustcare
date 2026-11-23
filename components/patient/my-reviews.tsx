"use client";
// Edit or delete your own reviews.
import { useCallback, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteReviewAction, updateReviewAction } from "@/lib/actions/patient";
import { Dialog } from "../dialog";
import { ReviewForm } from "./appointment-actions";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

type R = { id: string; waitRating: number; explanationRating: number; valueRating: number; text: string | null };

export function ReviewRowActions({ review, doctorName }: { review: R; doctorName: string }) {
  const { toast } = useApp();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [pending, start] = useTransition();
  const close = useCallback(() => setEdit(false), []);
  return (
    <div className="flex gap-1">
      <button type="button" className={btn.ghost} onClick={() => setEdit(true)} aria-label={`Edit review of ${doctorName}`}><Pencil size={16} aria-hidden="true" /> Edit</button>
      <button type="button" className={btn.ghost} onClick={() => setDel(true)} aria-label={`Delete review of ${doctorName}`}><Trash2 size={16} aria-hidden="true" /> Delete</button>
      <Dialog open={edit} onClose={close} title={`Edit your review of ${doctorName}`}>
        <ReviewForm review={review} action={updateReviewAction} onDone={close} />
      </Dialog>
      <Dialog open={del} onClose={() => setDel(false)} title="Delete this review?">
        <p className="text-ink-2">It will be removed from {doctorName}&apos;s profile and their rating will update.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setDel(false)}>Keep</button>
          <button type="button" disabled={pending} className={btn.danger} onClick={() => start(async () => { const r = await deleteReviewAction(review.id); toast(r.message ?? "", r.ok ? "success" : "error"); setDel(false); })}>Delete</button>
        </div>
      </Dialog>
    </div>
  );
}
