"use client";
// Master data: specialisations (Create, Read, Update, Delete).
import { useActionState, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteSpecialisationAction, saveSpecialisationAction } from "@/lib/actions/admin";
import { specialisationSchema, type FormState } from "@/lib/validation";
import { DataTable, type Column } from "./data-table";
import { ActionButton } from "./reason-button";
import { Dialog } from "../dialog";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

export type SpecRow = { id: string; name: string; simpleName: string; hindiName: string; doctors: number };

function SpecForm({ spec, onDone }: { spec?: SpecRow; onDone: () => void }) {
  const { toast } = useApp();
  const [state, action, isPending] = useActionState<FormState, FormData>(saveSpecialisationAction, {});
  const read = useCallback((fd: FormData) => ({ name: fd.get("name"), simpleName: fd.get("simpleName"), hindiName: fd.get("hindiName") }), []);
  const v = useClientValidation(specialisationSchema, read);
  useEffect(() => { if (state.ok) { toast(state.message!); onDone(); } }, [state, toast, onDone]);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {spec && <input type="hidden" name="id" value={spec.id} />}
      <Field label="Medical name" name="name" required hint="e.g. Dermatologist" error={err("name")}><input {...aria("name", err("name"), true)} defaultValue={spec?.name} className={inputCls} /></Field>
      <Field label="Plain-words name" name="simpleName" required hint="e.g. Skin doctor" error={err("simpleName")}><input {...aria("simpleName", err("simpleName"), true)} defaultValue={spec?.simpleName} className={inputCls} /></Field>
      <Field label="Hindi name" name="hindiName" required hint="e.g. त्वचा रोग विशेषज्ञ" error={err("hindiName")}><input {...aria("hindiName", err("hindiName"), true)} lang="hi" defaultValue={spec?.hindiName} className={inputCls} /></Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>{spec ? "Save changes" : "Add specialisation"}</SubmitButton>
    </form>
  );
}

export function SpecialisationsManager({ rows }: { rows: SpecRow[] }) {
  const [edit, setEdit] = useState<SpecRow | "new" | null>(null);
  const close = useCallback(() => setEdit(null), []);
  const columns: Column<SpecRow>[] = [
    { key: "name", header: "Medical name", sortValue: (s) => s.name, render: (s) => <b className="font-medium">{s.name}</b> },
    { key: "simple", header: "Plain words", sortValue: (s) => s.simpleName, render: (s) => s.simpleName },
    { key: "hindi", header: "Hindi", render: (s) => <span lang="hi">{s.hindiName}</span> },
    { key: "doctors", header: "Doctors", sortValue: (s) => s.doctors, render: (s) => s.doctors },
    {
      key: "actions", header: "Actions", render: (s) => (
        <div className="flex gap-1">
          <button type="button" className={btn.ghost} onClick={() => setEdit(s)} aria-label={`Edit ${s.name}`}><Pencil size={15} aria-hidden="true" /> Edit</button>
          <ActionButton label="Delete" variant="ghost" run={() => deleteSpecialisationAction(s.id)} />
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="mb-4 flex justify-end"><button type="button" className={btn.primary} onClick={() => setEdit("new")}><Plus size={16} aria-hidden="true" /> Add specialisation</button></div>
      <DataTable caption="Specialisations" rows={rows} columns={columns} searchText={(s) => `${s.name} ${s.simpleName} ${s.hindiName}`} />
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-2"><Trash2 size={14} aria-hidden="true" /> A specialisation still used by doctors can&apos;t be deleted.</p>
      <Dialog open={edit !== null} onClose={close} title={edit === "new" || edit === null ? "Add a specialisation" : `Edit ${edit.name}`}>
        {edit !== null && <SpecForm spec={edit === "new" ? undefined : edit} onDone={close} />}
      </Dialog>
    </>
  );
}
