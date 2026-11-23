"use client";
// Log-in form: email + password + CAPTCHA. Checks fields in the browser first;
// the server checks everything again (CAPTCHA first).
import Link from "next/link";
import { useActionState, useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation, useFocusFirstError } from "../form";
import { Turnstile } from "../turnstile";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(loginAction, {});
  const read = useCallback((fd: FormData) => ({ email: fd.get("email"), password: fd.get("password") }), []);
  const v = useClientValidation(loginSchema, read);
  const [show, setShow] = useState(false);
  useFocusFirstError(state);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];

  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-5">
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" required error={err("email")}>
        <input {...aria("email", err("email"))} type="email" autoComplete="email" className={inputCls} placeholder="name@example.com" />
      </Field>
      <Field label="Password" name="password" required error={err("password")}>
        <div className="flex gap-2">
          <input {...aria("password", err("password"))} type={show ? "text" : "password"} autoComplete="current-password" className={inputCls} />
          <button type="button" onClick={() => setShow((s) => !s)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#cfc9bf] hover:bg-soft" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
            {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </Field>
      <Turnstile error={state.errors?.captcha} />
      <SubmitButton pending={isPending} disabled={!v.valid} className="w-full">Log in</SubmitButton>
      <p className="text-sm text-ink-2">
        New here? <Link href="/signup" className="font-medium text-ink underline underline-offset-4">Create a patient account</Link> ·{" "}
        <Link href="/signup?role=doctor" className="font-medium text-ink underline underline-offset-4">Register as a doctor</Link>
      </p>
      <div className="rounded-2xl bg-soft p-4 text-sm text-ink-2">
        <p className="font-medium text-ink">Demo accounts (password <code>Demo@1234</code>)</p>
        <p className="mt-1">patient@demo.com · doctor@demo.com · doctor2@demo.com · admin@demo.com · hospital@demo.com · pending@demo.com · rejected@demo.com</p>
      </div>
    </form>
  );
}
