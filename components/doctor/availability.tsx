"use client";
// Weekly hours and leave (full CRUD). Saving leave first shows how many
// bookings it will cancel and asks for confirmation.
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { CalendarX, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBlockAction, deleteLeaveAction, leaveImpactAction, saveBlockAction, saveLeaveAction } from "@/lib/actions/doctor";
import type { FormState } from "@/lib/validation";
import { Dialog } from "../dialog";
import { Field, FormMessage, SubmitButton, keepValues, inputCls } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";
import { dayName, formatDateLong, formatMinute, toHHMM } from "@/lib/time";

type Block = { id: string; dayOfWeek: number; startMinute: number; endMinute: number };
type Leave = { id: string; fromDate: string; toDate: string; reason: string | null };

function BlockForm({ block, defaultDay, onDone }: { block?: Block; defaultDay: number; onDone: () => void }) {
  const { toast } = useApp();
  const [state, action, isPending] = useActionState<FormState, FormData>(saveBlockAction, {});
  useEffect(() => { if (state.ok) { toast(state.message!); onDone(); } }, [state, toast, onDone]);
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {block && <input type="hidden" name="id" value={block.id} />}
      <Field label="Day" name="dayOfWeek" required>
        <select id="dayOfWeek" name="dayOfWeek" defaultValue={block?.dayOfWeek ?? defaultDay} className={inputCls}>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{dayName(d)}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start" name="start" required error={state.errors?.start}>
          <input id="start" name="start" type="time" step={900} defaultValue={block ? toHHMM(block.startMinute) : "10:00"} className={inputCls} aria-invalid={!!state.errors?.start} />
        </Field>
        <Field label="End" name="end" required error={state.errors?.end}>
          <input id="end" name="end" type="time" step={900} defaultValue={block ? toHHMM(block.endMinute) : "13:00"} className={inputCls} aria-invalid={!!state.errors?.end} />
        </Field>
      </div>
      <p className="text-sm text-ink-2">Patients can book 15-minute slots inside this time.</p>
      <SubmitButton pending={isPending}>{block ? "Save hours" : "Add hours"}</SubmitButton>
    </form>
  );
}

function LeaveForm({ leave, today, onDone }: { leave?: Leave; today: string; onDone: () => void }) {
  const { toast } = useApp();
  const [state, action, isPending] = useActionState<FormState, FormData>(saveLeaveAction, {});
  const [from, setFrom] = useState(leave?.fromDate ?? "");
  const [to, setTo] = useState(leave?.toDate ?? "");
  const [impact, setImpact] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { if (state.ok) { toast(state.message!); onDone(); } }, [state, toast, onDone]);
  // When the dates change, ask the server how many bookings would be cancelled.
  const changeDates = (f: string, t: string) => {
    setFrom(f); setTo(t); setConfirmed(false);
    if (f && t && t >= f) leaveImpactAction(f, t).then(setImpact); else setImpact(null);
  };
  const clientErr = from && from < today ? "Leave can't start in the past." : from && to && to < from ? "End date must be on or after the start date." : "";
  const ready = from && to && !clientErr && (impact === 0 || confirmed);
  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {leave && <input type="hidden" name="id" value={leave.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" name="fromDate" required error={state.errors?.fromDate}>
          <input id="fromDate" name="fromDate" type="date" min={today} value={from} onChange={(e) => changeDates(e.target.value, to)} className={inputCls} />
        </Field>
        <Field label="To" name="toDate" required error={state.errors?.toDate || (clientErr && to ? clientErr : undefined)}>
          <input id="toDate" name="toDate" type="date" min={from || today} value={to} onChange={(e) => changeDates(from, e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Reason (optional)" name="reason">
        <input id="reason" name="reason" defaultValue={leave?.reason ?? ""} maxLength={120} className={inputCls} />
      </Field>
      {impact !== null && impact > 0 && (
        <div role="alert" className="rounded-2xl bg-warn-soft p-4 text-sm text-warn">
          <p className="font-semibold">⚠ This will cancel {impact} appointment{impact > 1 ? "s" : ""} and notify the patient{impact > 1 ? "s" : ""}. Continue?</p>
          <label className="mt-2 flex items-center gap-2 text-ink"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5 accent-ink" /> Yes, cancel them and notify the patients</label>
        </div>
      )}
      {impact === 0 && <p className="text-sm text-ok">✓ No booked appointments in this period.</p>}
      <SubmitButton pending={isPending} disabled={!ready}>{leave ? "Save leave" : "Add leave"}</SubmitButton>
    </form>
  );
}

export function AvailabilityManager({ blocks, leaves, today }: { blocks: Block[]; leaves: Leave[]; today: string }) {
  const { toast } = useApp();
  const [blockEdit, setBlockEdit] = useState<{ block?: Block; day: number } | null>(null);
  const [leaveEdit, setLeaveEdit] = useState<{ leave?: Leave } | null>(null);
  const [pending, start] = useTransition();
  const closeBlock = useCallback(() => setBlockEdit(null), []);
  const closeLeave = useCallback(() => setLeaveEdit(null), []);
  const del = (fn: () => Promise<FormState>) => start(async () => { const r = await fn(); toast(r.message ?? "", r.ok ? "success" : "error"); });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="hours-h" className="rounded-3xl border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="hours-h" className="text-lg font-medium">Weekly hours</h2>
          <button type="button" className={btn.primary} onClick={() => setBlockEdit({ day: 1 })}><Plus size={16} aria-hidden="true" /> Add hours</button>
        </div>
        <ul className="divide-y divide-line">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const list = blocks.filter((b) => b.dayOfWeek === d).sort((a, b) => a.startMinute - b.startMinute);
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-28 font-medium">{dayName(d)}</span>
                <div className="flex flex-1 flex-wrap gap-2">
                  {list.length === 0 && <span className="text-sm text-ink-2">Closed</span>}
                  {list.map((b) => (
                    <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-soft py-1 pl-3 pr-1 text-sm">
                      {formatMinute(b.startMinute)} – {formatMinute(b.endMinute)}
                      <button type="button" onClick={() => setBlockEdit({ block: b, day: d })} aria-label={`Edit ${dayName(d)} ${formatMinute(b.startMinute)} block`} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white"><Pencil size={14} aria-hidden="true" /></button>
                      <button type="button" disabled={pending} onClick={() => del(() => deleteBlockAction(b.id))} aria-label={`Delete ${dayName(d)} ${formatMinute(b.startMinute)} block`} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white"><Trash2 size={14} aria-hidden="true" /></button>
                    </span>
                  ))}
                </div>
                <button type="button" onClick={() => setBlockEdit({ day: d })} className="text-sm underline underline-offset-4" aria-label={`Add hours on ${dayName(d)}`}>+ Add</button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="leave-h" className="rounded-3xl border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="leave-h" className="text-lg font-medium">Leave</h2>
          <button type="button" className={btn.primary} onClick={() => setLeaveEdit({})}><CalendarX size={16} aria-hidden="true" /> Add leave</button>
        </div>
        {leaves.length === 0 ? <p className="text-ink-2">No upcoming leave.</p> : (
          <ul className="flex flex-col gap-2">
            {leaves.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-soft p-4">
                <div>
                  <p className="font-medium">{l.fromDate === l.toDate ? formatDateLong(l.fromDate) : `${formatDateLong(l.fromDate)} – ${formatDateLong(l.toDate)}`}</p>
                  {l.reason && <p className="text-sm text-ink-2">{l.reason}</p>}
                </div>
                <div className="flex gap-1">
                  <button type="button" className={btn.ghost} onClick={() => setLeaveEdit({ leave: l })}><Pencil size={15} aria-hidden="true" /> Edit</button>
                  <button type="button" disabled={pending} className={btn.ghost} onClick={() => del(() => deleteLeaveAction(l.id))}><Trash2 size={15} aria-hidden="true" /> Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-2">When you add leave, every requested or confirmed appointment in that period is cancelled and each patient gets a live notification with a Rebook button.</p>
      </section>

      <Dialog open={blockEdit !== null} onClose={closeBlock} title={blockEdit?.block ? "Edit hours" : "Add hours"}>
        {blockEdit && <BlockForm block={blockEdit.block} defaultDay={blockEdit.day} onDone={closeBlock} />}
      </Dialog>
      <Dialog open={leaveEdit !== null} onClose={closeLeave} title={leaveEdit?.leave ? "Edit leave" : "Add leave"}>
        {leaveEdit && <LeaveForm leave={leaveEdit.leave} today={today} onDone={closeLeave} />}
      </Dialog>
    </div>
  );
}
