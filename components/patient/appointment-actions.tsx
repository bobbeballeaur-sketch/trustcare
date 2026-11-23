"use client";
// Buttons on each of the patient's appointments: reschedule, cancel,
// add to calendar, get directions, write a review and rebook.
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition, useCallback } from "react";
import { CalendarPlus, Navigation, PencilLine, RefreshCw, X } from "lucide-react";
import { cancelByPatientAction, createReviewAction, rescheduleAction } from "@/lib/actions/patient";
import { getSlotsAction } from "@/lib/actions/slots";
import { reviewSchema, type FormState } from "@/lib/validation";
import { Dialog } from "../dialog";
import { SlotPicker, type Day } from "../doctors/slot-picker";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";
import { formatDateLong, formatMinute } from "@/lib/time";

type Appt = { id: string; doctorId: string; doctorName: string; date: string; startMinute: number; clinic: string };

/** Builds a .ics calendar file so the visit can be added to any phone calendar. */
function downloadIcs(a: Appt) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startUtc = new Date(Date.parse(a.date + "T00:00:00Z") + (a.startMinute - 330) * 60000);
  const endUtc = new Date(startUtc.getTime() + 15 * 60000);
  const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TrustCare//EN", "BEGIN:VEVENT", `UID:${a.id}@trustcare`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(startUtc)}`, `DTEND:${fmt(endUtc)}`, `SUMMARY:Appointment with ${a.doctorName}`, `LOCATION:${a.clinic.replace(/,/g, "\\,")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `trustcare-${a.date}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function UpcomingActions({ a }: { a: Appt }) {
  const { toast } = useApp();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState<Day[] | null>(null);
  const [slot, setSlot] = useState<{ date: string; minute: number } | null>(null);
  const [pending, start] = useTransition();
  const [moveState, moveAction] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await rescheduleAction(prev, fd);
    if (r.ok) { toast(r.message!); setMoveOpen(false); setDays(null); setSlot(null); }
    return r;
  }, {});
  const openMove = () => { setMoveOpen(true); getSlotsAction(a.doctorId).then(setDays); };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btn.secondary} onClick={openMove}><RefreshCw size={16} aria-hidden="true" /> Reschedule</button>
      <button type="button" className={btn.secondary} onClick={() => setCancelOpen(true)}><X size={16} aria-hidden="true" /> Cancel</button>
      <button type="button" className={btn.ghost} onClick={() => downloadIcs(a)}><CalendarPlus size={16} aria-hidden="true" /> Add to calendar</button>
      <a className={btn.ghost} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.clinic)}`} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" /> Directions</a>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this appointment?">
        <p className="text-ink-2">{a.doctorName} · {formatDateLong(a.date)}, {formatMinute(a.startMinute)}</p>
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">Reason (optional)
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={inputCls} />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setCancelOpen(false)}>Keep appointment</button>
          <button
            type="button"
            disabled={pending}
            className={btn.danger}
            onClick={() => start(async () => {
              const r = await cancelByPatientAction(a.id, reason);
              toast(r.message ?? "", r.ok ? "success" : "error");
              setCancelOpen(false);
            })}
          >Yes, cancel it</button>
        </div>
      </Dialog>

      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} title={`Reschedule with ${a.doctorName}`}>
        <form action={moveAction} className="flex flex-col gap-4">
          <FormMessage state={moveState} />
          <p className="text-sm text-ink-2">Currently {formatDateLong(a.date)}, {formatMinute(a.startMinute)}. The new time goes back to the doctor to confirm.</p>
          {days ? <SlotPicker days={days} value={slot} onChange={setSlot} /> : <p role="status">Loading free times…</p>}
          <input type="hidden" name="appointmentId" value={a.id} />
          <input type="hidden" name="date" value={slot?.date ?? ""} />
          <input type="hidden" name="startMinute" value={slot?.minute ?? ""} />
          <SubmitButton disabled={!slot}>{slot ? `Move to ${formatDateLong(slot.date)}, ${formatMinute(slot.minute)}` : "Choose a new time"}</SubmitButton>
        </form>
      </Dialog>
    </div>
  );
}

const STARS = [1, 2, 3, 4, 5];
function StarField({ name, label, value, onChange, error }: { name: string; label: string; value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-medium">{label} <span className="font-normal text-ink-2">(required)</span></legend>
      <div className="flex gap-1.5">
        {STARS.map((s) => (
          <label key={s} className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#f2b705] ${value >= s ? "border-ink bg-ink text-white" : "border-[#cfc9bf]"}`}>
            <input type="radio" name={name} value={s} checked={value === s} onChange={() => onChange(s)} className="sr-only" />
            <span aria-hidden="true">★{s}</span>
            <span className="sr-only">{s} out of 5</span>
          </label>
        ))}
      </div>
      {error && <p id={`${name}-error`} className="mt-1 text-sm font-medium text-danger">⚠ {error}</p>}
    </fieldset>
  );
}

/** Review form used for writing (and, with `review`, editing) a review. */
export function ReviewForm({
  appointmentId, review, action, onDone,
}: {
  appointmentId?: string;
  review?: { id: string; waitRating: number; explanationRating: number; valueRating: number; text: string | null };
  action: (s: FormState, f: FormData) => Promise<FormState>;
  onDone?: () => void;
}) {
  const { toast } = useApp();
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, {});
  const [r, setR] = useState({ waitRating: review?.waitRating ?? 0, explanationRating: review?.explanationRating ?? 0, valueRating: review?.valueRating ?? 0 });
  const [text, setText] = useState(review?.text ?? "");
  const read = useCallback((fd: FormData) => ({ waitRating: fd.get("waitRating"), explanationRating: fd.get("explanationRating"), valueRating: fd.get("valueRating"), text: ((fd.get("text") as string) ?? "").trim() }), []);
  const v = useClientValidation(reviewSchema, read);
  useEffect(() => { if (state.ok) { toast(state.message!); onDone?.(); } }, [state, toast, onDone]);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];

  return (
    <form onSubmit={keepValues(formAction)} {...v.formProps} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {appointmentId && <input type="hidden" name="appointmentId" value={appointmentId} />}
      {review && <input type="hidden" name="id" value={review.id} />}
      <StarField name="waitRating" label="Wait time" value={r.waitRating} onChange={(x) => setR({ ...r, waitRating: x })} error={state.errors?.waitRating} />
      <StarField name="explanationRating" label="Explained clearly" value={r.explanationRating} onChange={(x) => setR({ ...r, explanationRating: x })} error={state.errors?.explanationRating} />
      <StarField name="valueRating" label="Value for money" value={r.valueRating} onChange={(x) => setR({ ...r, valueRating: x })} error={state.errors?.valueRating} />
      <Field label="Your review (optional, 20–500 characters)" name="text" error={err("text")}>
        <textarea {...aria("text", err("text"))} rows={4} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} className={`${inputCls} h-auto py-3`} />
        <span className="text-right text-xs text-ink-2">{text.length}/500</span>
      </Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>{review ? "Save changes" : "Post review"}</SubmitButton>
    </form>
  );
}

export function WriteReview({ appointmentId, doctorName }: { appointmentId: string; doctorName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}><PencilLine size={16} aria-hidden="true" /> Write review</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Review ${doctorName}`}>
        <ReviewForm appointmentId={appointmentId} action={createReviewAction} onDone={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function RebookButton({ doctorId }: { doctorId: string }) {
  return <Link href={`/doctors/${doctorId}#book`} className={btn.primary}><RefreshCw size={16} aria-hidden="true" /> Rebook</Link>;
}
