"use client";
// Edit account details and change password, with live validation.
import { useActionState, useCallback } from "react";
import { changePasswordAction, updateAccountAction } from "@/lib/actions/account";
import { accountSchema, passwordChangeSchema, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, aria, inputCls, keepValues, useClientValidation } from "./form";

export function AccountForm({ initial }: { initial: { name: string; phone: string; preferredLanguage: string; email: string } }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(updateAccountAction, {});
  const read = useCallback((fd: FormData) => ({ name: fd.get("name"), phone: fd.get("phone"), preferredLanguage: fd.get("preferredLanguage") }), []);
  const v = useClientValidation(accountSchema, read);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field label="Email" name="email-ro" hint="Your email can't be changed."><input id="email-ro" value={initial.email} readOnly aria-describedby="email-ro-hint" className={`${inputCls} bg-soft`} /></Field>
      <Field label="Full name" name="name" required error={err("name")}><input {...aria("name", err("name"))} defaultValue={initial.name} className={inputCls} /></Field>
      <Field label="Mobile number" name="phone" required error={err("phone")}><input {...aria("phone", err("phone"))} defaultValue={initial.phone} inputMode="numeric" maxLength={10} className={inputCls} /></Field>
      <Field label="Preferred language" name="preferredLanguage" required>
        <select {...aria("preferredLanguage")} defaultValue={initial.preferredLanguage} className={inputCls}><option value="en">English</option><option value="hi">हिंदी (Hindi)</option></select>
      </Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>Save profile</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, isPending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const read = useCallback((fd: FormData) => ({ currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword"), confirmPassword: fd.get("confirmPassword") }), []);
  const v = useClientValidation(passwordChangeSchema, read);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field label="Current password" name="currentPassword" required error={err("currentPassword")}><input {...aria("currentPassword", err("currentPassword"))} type="password" autoComplete="current-password" className={inputCls} /></Field>
      <Field label="New password" name="newPassword" required hint="At least 8 characters with a letter and a number" error={err("newPassword")}><input {...aria("newPassword", err("newPassword"), true)} type="password" autoComplete="new-password" className={inputCls} /></Field>
      <Field label="Confirm new password" name="confirmPassword" required error={err("confirmPassword")}><input {...aria("confirmPassword", err("confirmPassword"))} type="password" autoComplete="new-password" className={inputCls} /></Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>Change password</SubmitButton>
    </form>
  );
}
