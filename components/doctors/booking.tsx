"use client";
// Booking in 4 short steps with a progress indicator:
// 1 Who → 2 Time → 3 Details → 4 Review & confirm.
import Link from "next/link";
import { useActionState, useState } from "react";
import { CircleCheck } from "lucide-react";
import { bookAppointmentAction } from "@/lib/actions/patient";
import type { FormState } from "@/lib/validation";
import { formatDateLong, formatMinute } from "@/lib/time";
import { FormMessage, SubmitButton, inputCls } from "../form";
import { SlotPicker, type Day } from "./slot-picker";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";

type Member = { id: string; name: string; relationship: string; accessibilityNeeds: string | null };

export function Booking({ doctorId, doctorName, days, family, mode, offersVideo = false, clinicFee, videoFee }: { doctorId: string; doctorName: string; days: Day[]; family: Member[]; mode: "patient" | "guest" | "other"; offersVideo?: boolean; clinicFee: number; videoFee?: number | null }) {
  const { lang, announce } = useApp();
  const [step, setStep] = useState(1);
  const [who, setWho] = useState<string>("");
  const [consult, setConsult] = useState<"CLINIC" | "VIDEO">("CLINIC");
  const price = consult === "VIDEO" ? (videoFee ?? clinicFee) : clinicFee;
  const [slot, setSlot] = useState<{ date: string; minute: number } | null>(null);
  const [reason, setReason] = useState("");
  const [needsHelp, setNeedsHelp] = useState(false);
  const [note, setNote] = useState("");
  const [state, action] = useActionState<FormState & { appointmentId?: string; mode?: string; fee?: number }, FormData>(bookAppointmentAction, {});

  // Choosing a family member with saved accessibility needs fills them in.
  const chooseWho = (id: string) => {
    setWho(id);
    const m = family.find((f) => f.id === id);
    if (m?.accessibilityNeeds) { setNeedsHelp(true); setNote(m.accessibilityNeeds); }
  };

  const steps = [pick(lang, "Who", "किसके लिए"), pick(lang, "Time", "समय"), pick(lang, "Details", "विवरण"), pick(lang, "Confirm", "पुष्टि")];
  const go = (n: number) => { setStep(n); announce(`Step ${n} of 4: ${steps[n - 1]}`); };
  const whoName = who ? family.find((f) => f.id === who)?.name : pick(lang, "Myself", "खुद");

  if (mode !== "patient")
    return (
      <div className="rounded-2xl bg-soft p-5">
        <p className="font-medium">{mode === "guest" ? pick(lang, "Log in to book an appointment.", "अपॉइंटमेंट बुक करने के लिए लॉग इन करें।") : "Only patient accounts can book appointments."}</p>
        {mode === "guest" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/login?next=/doctors/${doctorId}`} className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">{pick(lang, "Log in", "लॉग इन")}</Link>
            <Link href="/signup" className="rounded-full border border-[#cfc9bf] bg-white px-5 py-3 text-sm font-medium">{pick(lang, "Create account", "खाता बनाएं")}</Link>
          </div>
        )}
      </div>
    );

  if (state.ok)
    return (
      <div role="status" className="rounded-2xl bg-ok-soft p-6 text-ok">
        <CircleCheck size={32} aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold">{pick(lang, "Request sent", "अनुरोध भेजा गया")}</p>
        <p className="mt-1 text-ink">{state.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {state.appointmentId && (
            <Link href={`/pay/${state.appointmentId}`} className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">
              {pick(lang, `Pay ₹${state.fee} now`, `₹${state.fee} अभी चुकाएं`)}
            </Link>
          )}
          <Link href="/patient/appointments" className="inline-flex rounded-full border border-ok bg-white px-5 py-3 text-sm font-medium text-ink">{pick(lang, "View my appointments", "मेरी अपॉइंटमेंट देखें")}</Link>
        </div>
        <p className="mt-3 text-sm text-ink">{state.mode === "VIDEO" ? pick(lang, "Video consults must be paid before the call opens.", "वीडियो कॉल से पहले भुगतान ज़रूरी है।") : pick(lang, "You can also pay at the clinic.", "आप क्लिनिक पर भी भुगतान कर सकते हैं।")}</p>
      </div>
    );

  return (
    <div>
      <ol aria-label="Booking steps" className="mb-6 grid grid-cols-4 gap-2 text-xs">
        {steps.map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} className={`flex flex-col gap-1.5 ${step === i + 1 ? "font-semibold text-ink" : step > i + 1 ? "text-ink" : "text-ink-3"}`}>
            <span aria-hidden="true" className={`h-1.5 rounded-full ${step > i ? "bg-ink" : "bg-line"}`} />
            {i + 1} · {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div>
          {offersVideo && (
            <div className="mb-5">
              <p className="mb-3 font-semibold">{pick(lang, "Type of consultation", "परामर्श का प्रकार")}</p>
              <div className="grid grid-cols-2 gap-2">
                {([["CLINIC", "🏥", pick(lang, "In clinic", "क्लिनिक में"), clinicFee], ["VIDEO", "🎥", pick(lang, "Video consult", "वीडियो परामर्श"), videoFee ?? clinicFee]] as const).map(([k, icon, label, f]) => (
                  <label key={k} className={`flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#f2b705] ${consult === k ? "border-ink bg-soft" : "border-[#cfc9bf]"}`}>
                    <input type="radio" name="consult" checked={consult === k} onChange={() => setConsult(k)} className="sr-only" />
                    <span className="font-medium">{icon} {label}</span><span className="text-sm text-ink-2">₹{f}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <fieldset>
          <legend className="mb-3 font-semibold">{pick(lang, "Who is this visit for?", "यह विज़िट किसके लिए है?")}</legend>
          <div className="flex flex-col gap-2">
            {[{ id: "", label: pick(lang, "Myself", "खुद") }, ...family.map((f) => ({ id: f.id, label: `${f.name} (${f.relationship})` }))].map((o) => (
              <label key={o.id || "me"} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 ${who === o.id ? "border-ink bg-soft" : "border-[#cfc9bf]"}`}>
                <input type="radio" name="who" checked={who === o.id} onChange={() => chooseWho(o.id)} className="h-5 w-5 accent-ink" />
                {o.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-2">
            <Link href="/patient/family" className="underline underline-offset-4">{pick(lang, "Add a family member", "परिवार का सदस्य जोड़ें")}</Link>
          </p>
          </fieldset>
          <button type="button" onClick={() => go(2)} className="mt-5 h-12 w-full rounded-full bg-ink font-medium text-white">{pick(lang, "Continue", "आगे बढ़ें")}</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <SlotPicker days={days} value={slot} onChange={setSlot} />
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => go(1)} className="h-12 flex-1 rounded-full border border-[#cfc9bf]">{pick(lang, "Back", "पीछे")}</button>
            <button type="button" disabled={!slot} onClick={() => go(3)} className="h-12 flex-[2] rounded-full bg-ink font-medium text-white disabled:bg-[#8a857e]">
              {slot ? `${pick(lang, "Continue with", "आगे:")} ${formatMinute(slot.minute)}` : pick(lang, "Choose a time first", "पहले समय चुनें")}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {pick(lang, "Reason for visit (optional)", "विज़िट का कारण (वैकल्पिक)")}
            <span className="font-normal text-ink-2">{pick(lang, "You don't have to share this.", "यह बताना ज़रूरी नहीं।")}</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} rows={3} className={`${inputCls} h-auto py-3`} />
            <span className="text-right text-xs font-normal text-ink-2">{reason.length}/200</span>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#cfc9bf] px-4">
            <input type="checkbox" checked={needsHelp} onChange={(e) => setNeedsHelp(e.target.checked)} className="h-5 w-5 accent-ink" />
            {pick(lang, "I need accessibility help at the clinic", "मुझे क्लिनिक में सहायता चाहिए")}
          </label>
          {needsHelp && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {pick(lang, "What would help? (e.g. wheelchair user)", "क्या मदद चाहिए? (जैसे व्हीलचेयर)")}
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputCls} />
            </label>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => go(2)} className="h-12 flex-1 rounded-full border border-[#cfc9bf]">{pick(lang, "Back", "पीछे")}</button>
            <button type="button" onClick={() => go(4)} className="h-12 flex-[2] rounded-full bg-ink font-medium text-white">{pick(lang, "Review booking", "बुकिंग देखें")}</button>
          </div>
        </div>
      )}

      {step === 4 && slot && (
        <form action={action} className="flex flex-col gap-4">
          <FormMessage state={state} />
          <input type="hidden" name="doctorId" value={doctorId} />
          <input type="hidden" name="mode" value={consult} />
          <input type="hidden" name="familyMemberId" value={who} />
          <input type="hidden" name="date" value={slot.date} />
          <input type="hidden" name="startMinute" value={slot.minute} />
          <input type="hidden" name="reasonForVisit" value={reason} />
          <input type="hidden" name="accessibilityNote" value={needsHelp ? note : ""} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-soft p-4 text-sm">
            <dt className="text-ink-2">{pick(lang, "Doctor", "डॉक्टर")}</dt><dd className="font-medium">{doctorName}</dd>
            <dt className="text-ink-2">{pick(lang, "Patient", "मरीज़")}</dt><dd className="font-medium">{whoName}</dd>
            <dt className="text-ink-2">{pick(lang, "Type", "प्रकार")}</dt><dd className="font-medium">{consult === "VIDEO" ? pick(lang, "🎥 Video consult (online)", "🎥 वीडियो परामर्श") : pick(lang, "🏥 In clinic", "🏥 क्लिनिक में")}</dd>
            <dt className="text-ink-2">{pick(lang, "Fee", "शुल्क")}</dt><dd className="font-medium">₹{price}</dd>
            <dt className="text-ink-2">{pick(lang, "When", "कब")}</dt><dd className="font-medium">{formatDateLong(slot.date)}, {formatMinute(slot.minute)}</dd>
            <dt className="text-ink-2">{pick(lang, "Reason", "कारण")}</dt><dd>{reason || "—"}</dd>
            <dt className="text-ink-2">{pick(lang, "Access needs", "ज़रूरतें")}</dt><dd>{needsHelp && note ? note : "—"}</dd>
          </dl>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(3)} className="h-12 flex-1 rounded-full border border-[#cfc9bf]">{pick(lang, "Back", "पीछे")}</button>
            <SubmitButton className="flex-[2]">{pick(lang, "Confirm booking", "बुकिंग पक्की करें")}</SubmitButton>
          </div>
          {state.message && !state.ok && (
            <button type="button" onClick={() => go(2)} className="text-sm underline underline-offset-4">{pick(lang, "Choose another time", "दूसरा समय चुनें")}</button>
          )}
        </form>
      )}
    </div>
  );
}
