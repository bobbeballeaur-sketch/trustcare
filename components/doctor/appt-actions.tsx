"use client";
// Doctor's buttons for one appointment: Accept, Decline (reason required),
// Mark completed, Mark no-show, Cancel (reason required).
import { useState, useTransition } from "react";
import { Check, CircleCheck, Ban, TriangleAlert, X } from "lucide-react";
import { decideAppointmentAction } from "@/lib/actions/doctor";
import { Dialog } from "../dialog";
import { inputCls } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

export function DoctorApptActions({ id, status, past }: { id: string; status: string; past: boolean }) {
  const { toast } = useApp();
  const [pending, start] = useTransition();
  const [ask, setAsk] = useState<null | "decline" | "cancel">(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const run = (d: "accept" | "decline" | "complete" | "noshow" | "cancel", r = "") =>
    start(async () => {
      const res = await decideAppointmentAction(id, d, r);
      if (!res.ok && ask) { setErr(res.message ?? ""); return; }
      toast(res.message ?? "", res.ok ? "success" : "error");
      setAsk(null); setReason(""); setErr("");
    });

  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "REQUESTED" && !past && (
        <>
          <button type="button" disabled={pending} className={btn.primary} onClick={() => run("accept")}><Check size={16} aria-hidden="true" /> Accept</button>
          <button type="button" disabled={pending} className={btn.secondary} onClick={() => setAsk("decline")}><X size={16} aria-hidden="true" /> Decline</button>
        </>
      )}
      {status === "CONFIRMED" && past && (
        <>
          <button type="button" disabled={pending} className={btn.primary} onClick={() => run("complete")}><CircleCheck size={16} aria-hidden="true" /> Mark completed</button>
          <button type="button" disabled={pending} className={btn.secondary} onClick={() => run("noshow")}><TriangleAlert size={16} aria-hidden="true" /> No-show</button>
        </>
      )}
      {status === "CONFIRMED" && !past && (
        <button type="button" disabled={pending} className={btn.secondary} onClick={() => setAsk("cancel")}><Ban size={16} aria-hidden="true" /> Cancel</button>
      )}
      <Dialog open={ask !== null} onClose={() => { setAsk(null); setErr(""); }} title={ask === "decline" ? "Decline this request" : "Cancel this appointment"}>
        <label className="flex flex-col gap-1.5 text-sm font-medium">Reason <span className="font-normal text-ink-2">(required — the patient will see it)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} aria-invalid={!!err} aria-describedby={err ? "reason-error" : undefined} className={inputCls} />
        </label>
        {err && <p id="reason-error" role="alert" className="mt-2 text-sm font-medium text-danger">⚠ {err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setAsk(null)}>Back</button>
          <button type="button" disabled={pending || reason.trim().length < 5} className={btn.danger} onClick={() => run(ask!, reason)}>{ask === "decline" ? "Decline" : "Cancel appointment"}</button>
        </div>
      </Dialog>
    </div>
  );
}
