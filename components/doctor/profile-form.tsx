"use client";
// Doctor professional details: used for registration (step 2) and for
// editing the profile later. Same validation rules as the server.
import { useActionState, useCallback } from "react";
import { doctorProfileSchema, ACCESS_FEATURES, COUNCILS, LANGUAGES, type FormState } from "@/lib/validation";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation, useFocusFirstError } from "../form";

type Opt = { id: string; label: string };
export type ProfileValues = Partial<{
  qualifications: string; specialisationId: string; experienceYears: number; gender: string; languages: string[]; bio: string;
  registrationNumber: string; stateMedicalCouncil: string; registrationYear: number; clinicName: string; clinicAddress: string;
  areaId: string; pinCode: string; clinicPhone: string; fee: number; acceptsAyushman: boolean; offersVideo: boolean; videoFee: number | null;
}> & Partial<Record<(typeof ACCESS_FEATURES)[number][0], boolean>>;

export function ProfileForm({
  action, specs, areas, initial = {}, mode,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  specs: Opt[]; areas: Opt[]; initial?: ProfileValues; mode: "register" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, {});
  const read = useCallback((fd: FormData) => {
    const bool = (k: string) => fd.get(k) === "on";
    return {
      qualifications: fd.get("qualifications"), specialisationId: fd.get("specialisationId"), experienceYears: fd.get("experienceYears"),
      gender: fd.get("gender"), languages: fd.getAll("languages"), bio: fd.get("bio"), registrationNumber: fd.get("registrationNumber"),
      stateMedicalCouncil: fd.get("stateMedicalCouncil"), registrationYear: fd.get("registrationYear"), clinicName: fd.get("clinicName"),
      clinicAddress: fd.get("clinicAddress"), areaId: fd.get("areaId"), pinCode: fd.get("pinCode"), clinicPhone: fd.get("clinicPhone"),
      fee: fd.get("fee"), acceptsAyushman: bool("acceptsAyushman"), ramp: bool("ramp"), lift: bool("lift"), accessibleWashroom: bool("accessibleWashroom"),
      groundFloor: bool("groundFloor"), signLanguage: bool("signLanguage"), textBooking: bool("textBooking"), homeVisits: bool("homeVisits"),
      offersVideo: bool("offersVideo"), videoFee: (fd.get("videoFee") as string) || undefined,
      consent: bool("consent") ? true : undefined,
    };
  }, []);
  const v = useClientValidation(doctorProfileSchema, read);
  useFocusFirstError(state);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  const box = "rounded-3xl border border-line bg-white p-6";
  const h2 = "mb-5 text-lg font-medium";

  return (
    <form onSubmit={keepValues(formAction)} {...v.formProps} className="flex flex-col gap-6">
      <FormMessage state={state} />
      {Object.keys(state.errors ?? {}).length > 1 && (
        <div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger">
          <p className="font-semibold">Please fix {Object.keys(state.errors ?? {}).length} field(s):</p>
          <ul className="mt-1 list-disc pl-5">{Object.entries(state.errors ?? {}).map(([k, m]) => <li key={k}><a href={`#${k}`} className="underline">{m}</a></li>)}</ul>
        </div>
      )}

      <section className={box} aria-labelledby="pro-h">
        <h2 id="pro-h" className={h2}>Professional details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Qualifications" name="qualifications" required hint="e.g. MBBS, MD Dermatology" error={err("qualifications")}>
            <input {...aria("qualifications", err("qualifications"), true)} defaultValue={initial.qualifications} className={inputCls} />
          </Field>
          <Field label="Main specialisation" name="specialisationId" required error={err("specialisationId")}>
            <select {...aria("specialisationId", err("specialisationId"))} defaultValue={initial.specialisationId ?? ""} className={inputCls}>
              <option value="">Choose…</option>
              {specs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Years of experience" name="experienceYears" required hint="0 to 60" error={err("experienceYears")}>
            <input {...aria("experienceYears", err("experienceYears"), true)} type="number" min={0} max={60} defaultValue={initial.experienceYears} className={inputCls} />
          </Field>
          <Field label="Gender" name="gender" required error={err("gender")}>
            <select {...aria("gender", err("gender"))} defaultValue={initial.gender ?? ""} className={inputCls}>
              <option value="">Choose…</option><option>Female</option><option>Male</option><option>Other</option>
            </select>
          </Field>
        </div>
        <fieldset className="mt-5" aria-describedby={err("languages") ? "languages-error" : undefined}>
          <legend className="mb-2 text-sm font-medium">Languages spoken <span className="font-normal text-ink-2">(required, choose at least one)</span></legend>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <label key={l} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#cfc9bf] px-3">
                <input type="checkbox" name="languages" value={l} defaultChecked={initial.languages?.includes(l)} className="h-5 w-5 accent-ink" />{l}
              </label>
            ))}
          </div>
          {err("languages") && <p id="languages-error" className="mt-1 text-sm font-medium text-danger">⚠ {err("languages")}</p>}
        </fieldset>
        <div className="mt-5">
          <Field label="Short bio" name="bio" required hint="50 to 500 characters" error={err("bio")}>
            <textarea {...aria("bio", err("bio"), true)} rows={4} maxLength={500} defaultValue={initial.bio} className={`${inputCls} h-auto py-3`} />
          </Field>
        </div>
      </section>

      <section className={box} aria-labelledby="reg-h">
        <h2 id="reg-h" className={h2}>Medical registration</h2>
        {mode === "edit" && <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">⚠ Changing your registration number, council or year sends your profile back to Pending. You will be hidden from search until our team re-checks it.</p>}
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Registration number" name="registrationNumber" required error={err("registrationNumber")}>
            <input {...aria("registrationNumber", err("registrationNumber"))} defaultValue={initial.registrationNumber} className={inputCls} />
          </Field>
          <Field label="State Medical Council" name="stateMedicalCouncil" required error={err("stateMedicalCouncil")}>
            <select {...aria("stateMedicalCouncil", err("stateMedicalCouncil"))} defaultValue={initial.stateMedicalCouncil ?? ""} className={inputCls}>
              <option value="">Choose…</option>
              {COUNCILS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Year of registration" name="registrationYear" required error={err("registrationYear")}>
            <input {...aria("registrationYear", err("registrationYear"))} type="number" min={1960} max={new Date().getFullYear()} defaultValue={initial.registrationYear} className={inputCls} />
          </Field>
        </div>
      </section>

      <section className={box} aria-labelledby="clinic-h">
        <h2 id="clinic-h" className={h2}>Clinic</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Clinic name" name="clinicName" required error={err("clinicName")}>
            <input {...aria("clinicName", err("clinicName"))} defaultValue={initial.clinicName} className={inputCls} />
          </Field>
          <Field label="Area of Indore" name="areaId" required error={err("areaId")}>
            <select {...aria("areaId", err("areaId"))} defaultValue={initial.areaId ?? ""} className={inputCls}>
              <option value="">Choose…</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Full address" name="clinicAddress" required error={err("clinicAddress")}>
              <input {...aria("clinicAddress", err("clinicAddress"))} defaultValue={initial.clinicAddress} className={inputCls} />
            </Field>
          </div>
          <Field label="PIN code" name="pinCode" required hint="6 digits" error={err("pinCode")}>
            <input {...aria("pinCode", err("pinCode"), true)} inputMode="numeric" maxLength={6} defaultValue={initial.pinCode} className={inputCls} />
          </Field>
          <Field label="Clinic phone" name="clinicPhone" required hint="10 digits, starting 6–9" error={err("clinicPhone")}>
            <input {...aria("clinicPhone", err("clinicPhone"), true)} type="tel" inputMode="numeric" maxLength={10} defaultValue={initial.clinicPhone} className={inputCls} />
          </Field>
          <Field label="Consultation fee (₹)" name="fee" required hint="₹100 to ₹5,000" error={err("fee")}>
            <input {...aria("fee", err("fee"), true)} type="number" min={100} max={5000} step={50} defaultValue={initial.fee} className={inputCls} />
          </Field>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-[#cfc9bf] px-4">
            <input type="checkbox" name="acceptsAyushman" defaultChecked={initial.acceptsAyushman} className="h-5 w-5 accent-ink" /> Accepts Ayushman card (PM-JAY)
          </label>
        </div>
        <div className="mt-6 grid gap-4 rounded-2xl bg-soft p-4 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-[#cfc9bf] bg-white px-4">
            <input type="checkbox" name="offersVideo" defaultChecked={initial.offersVideo} className="h-5 w-5 accent-ink" /> 🎥 I offer online video consultations (from home)
          </label>
          <Field label="Video consult fee (₹, optional)" name="videoFee" hint="₹100 to ₹5,000. Leave empty to use the clinic fee." error={err("videoFee")}>
            <input {...aria("videoFee", err("videoFee"), true)} type="number" min={100} max={5000} step={50} defaultValue={initial.videoFee ?? undefined} className={inputCls} />
          </Field>
        </div>
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium">Clinic accessibility</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACCESS_FEATURES.map(([k, l]) => (
              <label key={k} className="flex min-h-11 items-center gap-3 rounded-xl border border-[#cfc9bf] px-4">
                <input type="checkbox" name={k} defaultChecked={!!initial[k]} className="h-5 w-5 accent-ink" />{l}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <label className="flex items-start gap-3 rounded-2xl bg-soft p-4">
        <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 shrink-0 accent-ink" aria-describedby={err("consent") ? "consent-error" : undefined} />
        <span>I confirm these details are true. I understand the admin will check my registration on the NMC Indian Medical Register. <span className="text-ink-2">(required)</span>
          {err("consent") && <span id="consent-error" className="mt-1 block text-sm font-medium text-danger">⚠ {err("consent")}</span>}
        </span>
      </label>
      <SubmitButton pending={isPending} disabled={!v.valid} className="self-start">{mode === "register" ? "Submit for verification" : "Save profile"}</SubmitButton>
      {!v.valid && <p className="text-sm text-ink-2">The button turns on when all required fields are valid.</p>}
    </form>
  );
}
