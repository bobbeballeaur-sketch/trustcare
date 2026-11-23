"use client";
// Form for the hospital to update live availability.
import { useActionState, useCallback } from "react";
import { updateHospitalAction } from "@/lib/actions/hospital";
import { BLOOD_GROUPS, hospitalSchema, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, aria, inputCls, keepValues, useClientValidation } from "./form";

type H = { phone: string; bedsAvailable: number; icuAvailable: number; oxygenAvailable: boolean; open24x7: boolean; emergencyWard: boolean; acceptsAyushman: boolean; bloodGroups: string[]; specialities: string[] };

export function HospitalForm({ h }: { h: H }) {
  const [state, action, isPending] = useActionState<FormState, FormData>(updateHospitalAction, {});
  const read = useCallback((fd: FormData) => ({
    phone: fd.get("phone"), bedsAvailable: fd.get("bedsAvailable"), icuAvailable: fd.get("icuAvailable"),
    oxygenAvailable: fd.get("oxygenAvailable") === "on", open24x7: fd.get("open24x7") === "on", emergencyWard: fd.get("emergencyWard") === "on",
    acceptsAyushman: fd.get("acceptsAyushman") === "on", bloodGroups: fd.getAll("bloodGroups"), specialities: fd.get("specialities") ?? "",
  }), []);
  const v = useClientValidation(hospitalSchema, read);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  const box = "flex min-h-12 items-center gap-3 rounded-xl border border-[#cfc9bf] px-4";
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Free beds" name="bedsAvailable" required error={err("bedsAvailable")}><input {...aria("bedsAvailable", err("bedsAvailable"))} type="number" min={0} defaultValue={h.bedsAvailable} className={inputCls} /></Field>
        <Field label="Free ICU beds" name="icuAvailable" required error={err("icuAvailable")}><input {...aria("icuAvailable", err("icuAvailable"))} type="number" min={0} defaultValue={h.icuAvailable} className={inputCls} /></Field>
        <Field label="Phone" name="phone" required error={err("phone")}><input {...aria("phone", err("phone"))} defaultValue={h.phone} className={inputCls} /></Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={box}><input type="checkbox" name="oxygenAvailable" defaultChecked={h.oxygenAvailable} className="h-5 w-5 accent-ink" /> Oxygen available</label>
        <label className={box}><input type="checkbox" name="open24x7" defaultChecked={h.open24x7} className="h-5 w-5 accent-ink" /> Open 24×7</label>
        <label className={box}><input type="checkbox" name="emergencyWard" defaultChecked={h.emergencyWard} className="h-5 w-5 accent-ink" /> Emergency ward</label>
        <label className={box}><input type="checkbox" name="acceptsAyushman" defaultChecked={h.acceptsAyushman} className="h-5 w-5 accent-ink" /> Accepts Ayushman card</label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Blood groups in stock</legend>
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map((g) => <label key={g} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#cfc9bf] px-3"><input type="checkbox" name="bloodGroups" value={g} defaultChecked={h.bloodGroups.includes(g)} className="h-5 w-5 accent-ink" />{g}</label>)}
        </div>
      </fieldset>
      <Field label="Specialities" name="specialities" hint="Separate with commas, e.g. Cardiology, Trauma" error={err("specialities")}>
        <input {...aria("specialities", err("specialities"), true)} defaultValue={h.specialities.join(", ")} className={inputCls} />
      </Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>Update availability</SubmitButton>
    </form>
  );
}
