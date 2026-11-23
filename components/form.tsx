"use client";
// Form building blocks with accessible errors:
// - each field has a visible label and says "required" in words
// - errors appear under the field as soon as you leave it (client-side check)
// - the error is linked to the field so screen readers read it out
// - the server's answer (server-side check) is shown the same way
import { useFormStatus } from "react-dom";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { ZodType } from "zod";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import type { FormState } from "@/lib/validation";

export const inputCls =
  "h-12 w-full rounded-xl border border-[#cfc9bf] bg-white px-3.5 text-base text-ink placeholder:text-ink-3 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger";

export function Field({
  label,
  name,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="font-normal text-ink-2">(required)</span>}
      </label>
      {hint && <p id={`${name}-hint`} className="text-sm text-ink-2">{hint}</p>}
      {children}
      {error && (
        <p id={`${name}-error`} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

/** Props that link an input to its label, hint and error. */
export function aria(name: string, error?: string, hint?: boolean) {
  const ids = [hint ? `${name}-hint` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ");
  return { id: name, name, "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined };
}

/**
 * Client-side validation with a zod schema.
 * `read` turns the form into the object the schema expects.
 */
export function useClientValidation<T>(schema: ZodType<T>, read: (fd: FormData) => unknown) {
  const formRef = useRef<HTMLFormElement>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valid, setValid] = useState(false);

  const check = useCallback(() => {
    if (!formRef.current) return;
    const result = schema.safeParse(read(new FormData(formRef.current)));
    const errs: Record<string, string> = {};
    if (!result.success) for (const i of result.error.issues) { const k = String(i.path[0] ?? "form"); if (!errs[k]) errs[k] = i.message; }
    setErrors(errs);
    setValid(result.success);
  }, [schema, read]);

  useEffect(() => { check(); }, [check]);

  const formProps = {
    ref: formRef,
    noValidate: true,
    onBlur: (e: React.FocusEvent<HTMLFormElement>) => {
      const n = (e.target as unknown as HTMLInputElement).name;
      if (n) setTouched((t) => ({ ...t, [n]: true }));
      check();
    },
    onChange: () => check(),
  };
  /** Error to show for a field: only after the user has left it. */
  const shown = (name: string) => (touched[name] ? errors[name] : undefined);
  const touchAll = () => setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
  return { formProps, shown, valid, touchAll, errors };
}

/** Moves keyboard focus to the first field with an error after submitting. */
export function useFocusFirstError(state: FormState) {
  useEffect(() => {
    if (!state.errors) return;
    const first = Object.keys(state.errors)[0];
    const el = first ? document.getElementById(first) : null;
    (el ?? document.getElementById("form-summary"))?.focus();
  }, [state]);
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <div
      id="form-summary"
      tabIndex={-1}
      role={state.ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
    >
      {state.ok ? <CircleCheck size={18} className="shrink-0" aria-hidden="true" /> : <CircleAlert size={18} className="shrink-0" aria-hidden="true" />}
      <span>{state.message}</span>
    </div>
  );
}

/**
 * Submits the form to a server action WITHOUT clearing the fields afterwards
 * (React normally resets a form after an action; we keep what the user typed
 * so they can fix a mistake instead of retyping everything).
 */
export function keepValues(dispatch: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}

export function SubmitButton({ children, disabled, className = "", pending: busy = false }: { children: React.ReactNode; disabled?: boolean; className?: string; pending?: boolean }) {
  const { pending: formPending } = useFormStatus();
  const pending = busy || formPending;
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-[#8a857e] ${className}`}
    >
      {pending && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
