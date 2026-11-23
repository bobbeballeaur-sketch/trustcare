"use client";
// A button that asks for a reason in a pop-up before running an admin action.
import { useState, useTransition } from "react";
import type { FormState } from "@/lib/validation";
import { Dialog } from "../dialog";
import { inputCls } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

export function ReasonButton({
  label, title, confirmLabel, run, variant = "secondary", needReason = true, help,
}: {
  label: string; title: string; confirmLabel: string; run: (reason: string) => Promise<FormState>;
  variant?: keyof typeof btn; needReason?: boolean; help?: string;
}) {
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className={btn[variant]} onClick={() => setOpen(true)}>{label}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        {help && <p className="mb-4 text-ink-2">{help}</p>}
        {needReason && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">Reason <span className="font-normal text-ink-2">(required)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className={inputCls} aria-invalid={!!err} aria-describedby={err ? "rb-err" : undefined} />
          </label>
        )}
        {err && <p id="rb-err" role="alert" className="mt-2 text-sm font-medium text-danger">⚠ {err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>Back</button>
          <button type="button" disabled={pending || (needReason && reason.trim().length < 5)} className={variant === "danger" ? btn.danger : btn.primary}
            onClick={() => start(async () => {
              const r = await run(reason);
              if (!r.ok) { setErr(r.message ?? "Something went wrong."); return; }
              toast(r.message ?? "Done.");
              setOpen(false); setReason(""); setErr("");
            })}
          >{confirmLabel}</button>
        </div>
      </Dialog>
    </>
  );
}

export function ActionButton({ label, run, variant = "primary" }: { label: string; run: () => Promise<FormState>; variant?: keyof typeof btn }) {
  const { toast } = useApp();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className={btn[variant]} onClick={() => start(async () => { const r = await run(); toast(r.message ?? "", r.ok ? "success" : "error"); })}>{label}</button>
  );
}
