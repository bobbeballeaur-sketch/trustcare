"use client";
// Demo checkout: UPI, card or net banking. Every field is checked in the
// browser and again on the server, but no real money is ever charged.
import { useActionState, useCallback, useState } from "react";
import { CreditCard, Landmark, Smartphone } from "lucide-react";
import { payAction } from "@/lib/actions/consult";
import { BANKS, paymentSchema, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, aria, inputCls, keepValues, useClientValidation } from "../form";

export function PayForm({ appointmentId, amount }: { appointmentId: string; amount: number }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(payAction, {});
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const read = useCallback((fd: FormData) => ({
    method: fd.get("method"), upiId: (fd.get("upiId") as string) || undefined, cardNumber: (fd.get("cardNumber") as string) || undefined,
    cardName: (fd.get("cardName") as string) || undefined, expiry: (fd.get("expiry") as string) || undefined, cvv: (fd.get("cvv") as string) || undefined, bank: (fd.get("bank") as string) || undefined,
  }), []);
  const v = useClientValidation(paymentSchema, read);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  if (state.ok) return <FormMessage state={state} />;
  const tab = (k: typeof method, label: string, Icon: React.ElementType) => (
    <label className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#f2b705] ${method === k ? "border-ink bg-ink text-white" : "border-[#cfc9bf]"}`}>
      <input type="radio" name="method" value={k} checked={method === k} onChange={() => setMethod(k)} className="sr-only" />
      <Icon size={18} aria-hidden="true" /> {label}
    </label>
  );
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Pay with</legend>
        <div className="flex gap-2">{tab("upi", "UPI", Smartphone)}{tab("card", "Card", CreditCard)}{tab("netbanking", "Net banking", Landmark)}</div>
      </fieldset>
      {method === "upi" && (
        <Field label="UPI ID" name="upiId" required hint="e.g. priya@okaxis" error={err("upiId")}><input {...aria("upiId", err("upiId"), true)} autoComplete="off" className={inputCls} /></Field>
      )}
      {method === "card" && (
        <>
          <Field label="Card number" name="cardNumber" required hint="Demo card: 4111 1111 1111 1111" error={err("cardNumber")}><input {...aria("cardNumber", err("cardNumber"), true)} inputMode="numeric" maxLength={19} autoComplete="off" className={inputCls} /></Field>
          <Field label="Name on card" name="cardName" required error={err("cardName")}><input {...aria("cardName", err("cardName"))} autoComplete="off" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry (MM/YY)" name="expiry" required error={err("expiry")}><input {...aria("expiry", err("expiry"))} placeholder="08/28" maxLength={5} autoComplete="off" className={inputCls} /></Field>
            <Field label="CVV" name="cvv" required error={err("cvv")}><input {...aria("cvv", err("cvv"))} type="password" inputMode="numeric" maxLength={3} autoComplete="off" className={inputCls} /></Field>
          </div>
        </>
      )}
      {method === "netbanking" && (
        <Field label="Your bank" name="bank" required error={err("bank")}>
          <select {...aria("bank", err("bank"))} defaultValue="" className={inputCls}><option value="" disabled>Choose…</option>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
        </Field>
      )}
      <SubmitButton pending={isPending} disabled={!v.valid}>Pay ₹{amount}</SubmitButton>
      <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">⚠ Demo payment for a college project — no real money is charged. Don&apos;t enter real card details.</p>
    </form>
  );
}
