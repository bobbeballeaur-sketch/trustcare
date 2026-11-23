"use client";
// Sign-up form for patients and doctors (doctors add professional details next).
import Link from "next/link";
import { useActionState, useCallback, useState } from "react";
import { signupAction } from "@/lib/actions/auth";
import { signupSchema, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation, useFocusFirstError } from "../form";
import { Turnstile } from "../turnstile";

/** 0–4 score for the live password strength meter. */
function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}
const LABELS = ["Too weak", "Weak", "Okay", "Good", "Strong"];

export function SignupForm({ asDoctor }: { asDoctor: boolean }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(signupAction, {});
  const read = useCallback((fd: FormData) => ({
    name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), password: fd.get("password"),
    confirmPassword: fd.get("confirmPassword"), preferredLanguage: fd.get("preferredLanguage") || "en",
  }), []);
  const v = useClientValidation(signupSchema, read);
  const [pw, setPw] = useState("");
  const [captcha, setCaptcha] = useState(false);
  useFocusFirstError(state);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  const score = strength(pw);
  const onVerify = useCallback((ok: boolean) => setCaptcha(ok), []);

  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="role" value={asDoctor ? "DOCTOR" : "PATIENT"} />
      <Field label="Full name" name="name" required error={err("name")}>
        <input {...aria("name", err("name"))} autoComplete="name" className={inputCls} />
      </Field>
      <Field label="Email" name="email" required error={err("email")}>
        <input {...aria("email", err("email"))} type="email" autoComplete="email" className={inputCls} />
      </Field>
      <Field label="Mobile number" name="phone" required error={err("phone")} hint="10 digits, starting with 6, 7, 8 or 9">
        <input {...aria("phone", err("phone"), true)} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" className={inputCls} />
      </Field>
      <Field label="Password" name="password" required error={err("password")} hint="At least 8 characters with a letter and a number">
        <input {...aria("password", err("password"), true)} type="password" autoComplete="new-password" className={inputCls} onChange={(e) => setPw(e.target.value)} />
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? (score < 2 ? "bg-danger" : score < 3 ? "bg-warn" : "bg-ok") : "bg-line"}`} />)}
          </div>
          <span className="w-20 text-right text-xs font-medium text-ink-2">{pw ? `Strength: ${LABELS[score]}` : ""}</span>
        </div>
      </Field>
      <Field label="Confirm password" name="confirmPassword" required error={err("confirmPassword")}>
        <input {...aria("confirmPassword", err("confirmPassword"))} type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Preferred language" name="preferredLanguage" required>
        <select {...aria("preferredLanguage")} className={inputCls} defaultValue="en">
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
        </select>
      </Field>
      <Turnstile onVerify={onVerify} error={state.errors?.captcha} />
      <SubmitButton pending={isPending} disabled={!v.valid || !captcha} className="w-full">
        {asDoctor ? "Continue to professional details" : "Create account"}
      </SubmitButton>
      {!v.valid && <p className="text-sm text-ink-2">The button turns on when every field is filled in correctly and the security check is done.</p>}
      <p className="text-sm text-ink-2">
        Already have an account? <Link href="/login" className="font-medium text-ink underline underline-offset-4">Log in</Link>
        {asDoctor ? (
          <> · <Link href="/signup" className="font-medium text-ink underline underline-offset-4">I&apos;m a patient</Link></>
        ) : (
          <> · <Link href="/signup?role=doctor" className="font-medium text-ink underline underline-offset-4">I&apos;m a doctor</Link></>
        )}
      </p>
    </form>
  );
}
