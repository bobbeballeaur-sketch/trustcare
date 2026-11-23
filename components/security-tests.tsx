"use client";
// Security test panel for the live demo. Each button sends a TAMPERED request
// straight to the real server action — skipping the normal page — and shows
// the server's answer. This proves the checks run on the server, not just in
// the browser.
import { useState, useTransition } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { bookAppointmentAction, createReviewAction } from "@/lib/actions/patient";
import { decideAppointmentAction } from "@/lib/actions/doctor";
import { deleteSpecialisationAction, resetDemoAction } from "@/lib/actions/admin";
import { loginAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/validation";
import { btn } from "./shell-buttons";
import { useApp } from "./providers";

type Test = { trap: number; title: string; sends: Record<string, unknown>; run: () => Promise<FormState> };

function fd(obj: Record<string, unknown>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, String(v ?? ""));
  return f;
}

function TestCard({ t }: { t: Test }) {
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, start] = useTransition();
  const blocked = result && !result.ok;
  return (
    <li className="rounded-3xl border border-line bg-white p-5">
      <p className="eyebrow text-ink-2">Demo trap {t.trap}</p>
      <h3 className="mt-1 text-lg font-medium">{t.title}</h3>
      <p className="mt-3 text-sm font-medium">Request sent to the server:</p>
      <pre className="mt-1 overflow-x-auto rounded-xl bg-night p-3 text-xs text-white">{JSON.stringify(t.sends, null, 2)}</pre>
      <button type="button" disabled={pending} className={`${btn.primary} mt-4`} onClick={() => start(async () => { try { setResult(await t.run()); } catch (e) { setResult({ message: (e as Error).message }); } })}>
        {pending ? "Sending…" : "Send tampered request"}
      </button>
      {result && (
        <p role="status" className={`mt-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${blocked ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}>
          {blocked ? <ShieldCheck size={18} className="shrink-0" aria-hidden="true" /> : <ShieldX size={18} className="shrink-0" aria-hidden="true" />}
          <span>{blocked ? "Blocked by the server: " : "Not blocked: "}“{result.message}”</span>
        </p>
      )}
    </li>
  );
}

export type SecurityContext = {
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  yesterday: string;
  mehtaId?: string;
  takenSlot?: { doctorId: string; date: string; startMinute: number };
  pendingDoctorId?: string;
  futureDate?: string;
  upcomingApptId?: string;
  otherDoctorApptId?: string;
  usedSpecId?: string;
  usedSpecName?: string;
};

export function SecurityTests({ ctx }: { ctx: SecurityContext }) {
  const { toast } = useApp();
  const [pending, start] = useTransition();
  const tests: Test[] = [
    { trap: 6, title: "Log in without completing the CAPTCHA", sends: { email: "patient@demo.com", password: "Demo@1234", "cf-turnstile-response": "(missing)" }, run: () => loginAction({}, fd({ email: "patient@demo.com", password: "Demo@1234" })) },
  ];
  if (ctx.role === "PATIENT") {
    if (ctx.mehtaId) tests.push({ trap: 3, title: "Book a time in the past (changed the date by hand)", sends: { doctorId: ctx.mehtaId, date: ctx.yesterday, startMinute: 600 }, run: () => bookAppointmentAction({}, fd({ doctorId: ctx.mehtaId, date: ctx.yesterday, startMinute: 600 })) });
    if (ctx.takenSlot) tests.push({ trap: 2, title: "Book a slot someone else already has", sends: ctx.takenSlot, run: () => bookAppointmentAction({}, fd(ctx.takenSlot!)) });
    if (ctx.upcomingApptId) tests.push({ trap: 4, title: "Write a review without a completed visit", sends: { appointmentId: ctx.upcomingApptId, waitRating: 5, explanationRating: 5, valueRating: 5, text: "Great doctor, highly recommended to all!" }, run: () => createReviewAction({}, fd({ appointmentId: ctx.upcomingApptId, waitRating: 5, explanationRating: 5, valueRating: 5, text: "Great doctor, highly recommended to all!" })) });
    if (ctx.pendingDoctorId && ctx.futureDate) tests.push({ trap: 7, title: "Book a doctor who is still pending verification", sends: { doctorId: ctx.pendingDoctorId, date: ctx.futureDate, startMinute: 660 }, run: () => bookAppointmentAction({}, fd({ doctorId: ctx.pendingDoctorId, date: ctx.futureDate, startMinute: 660 })) });
  }
  if (ctx.role === "DOCTOR" && ctx.otherDoctorApptId)
    tests.push({ trap: 5, title: "Accept another doctor's appointment (changed the ID)", sends: { appointmentId: ctx.otherDoctorApptId, decision: "accept" }, run: () => decideAppointmentAction(ctx.otherDoctorApptId!, "accept") });
  if (ctx.role === "ADMIN" && ctx.usedSpecId)
    tests.push({ trap: 8, title: `Delete a specialisation still used by doctors (${ctx.usedSpecName})`, sends: { specialisationId: ctx.usedSpecId, action: "delete" }, run: () => deleteSpecialisationAction(ctx.usedSpecId!) });

  return (
    <>
      <ul className="grid gap-4 lg:grid-cols-2">{tests.map((t) => <TestCard key={t.trap + t.title} t={t} />)}</ul>
      <p className="mt-6 text-sm text-ink-2">
        {ctx.role === "PATIENT" ? "Log in as doctor@demo.com to try trap 5, or admin@demo.com for trap 8." : ctx.role === "DOCTOR" ? "Log in as patient@demo.com for traps 2, 3, 4 and 7." : "Log in as patient@demo.com or doctor@demo.com for the other traps."}{" "}
        Traps 1 (duplicate email at sign-up) and 9 (cancelling less than 2 hours before) are shown on the normal pages.
      </p>
      {ctx.role === "ADMIN" && (
        <section aria-labelledby="reset-h" className="mt-10 rounded-3xl border-2 border-danger/40 bg-white p-6">
          <h2 id="reset-h" className="text-xl font-medium">Demo tools</h2>
          <p className="mt-1 text-ink-2">Deletes everything and re-creates the demo doctors, patients, appointments and reviews. Press this before the presentation.</p>
          <button type="button" disabled={pending} className={`${btn.danger} mt-4`} onClick={() => {
            if (!confirm("Reset ALL demo data? Everything added during testing will be deleted.")) return;
            start(async () => { const r = await resetDemoAction(); toast(r.message ?? "", r.ok ? "success" : "error"); });
          }}>{pending ? "Resetting…" : "Reset demo data"}</button>
        </section>
      )}
    </>
  );
}
