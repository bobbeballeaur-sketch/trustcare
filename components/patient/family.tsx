"use client";
// Family members: add, edit and delete (full CRUD) with validation.
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteFamilyMemberAction, saveFamilyMemberAction } from "@/lib/actions/patient";
import { familyMemberSchema, type FormState } from "@/lib/validation";
import { Dialog } from "../dialog";
import { Field, FormMessage, SubmitButton, keepValues, aria, inputCls, useClientValidation, useFocusFirstError } from "../form";
import { useApp } from "../providers";
import { btn } from "../shell-buttons";

type Member = { id: string; name: string; relationship: string; dateOfBirth: string; gender: string; accessibilityNeeds: string | null };

function age(dob: string) {
  const b = new Date(dob), n = new Date();
  return n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
}

function MemberForm({ member, onDone }: { member?: Member; onDone: () => void }) {
  const { toast } = useApp();
  const [state, action, isPending] = useActionState<FormState, FormData>(saveFamilyMemberAction, {});
  const read = useCallback((fd: FormData) => ({ name: fd.get("name"), relationship: fd.get("relationship"), dateOfBirth: fd.get("dateOfBirth"), gender: fd.get("gender"), accessibilityNeeds: (fd.get("accessibilityNeeds") as string) || undefined }), []);
  const v = useClientValidation(familyMemberSchema, read);
  useFocusFirstError(state);
  useEffect(() => { if (state.ok) { toast(state.message!); onDone(); } }, [state, toast, onDone]);
  const err = (k: string) => v.shown(k) ?? state.errors?.[k];
  return (
    <form onSubmit={keepValues(action)} {...v.formProps} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {member && <input type="hidden" name="id" value={member.id} />}
      <Field label="Name" name="name" required error={err("name")}>
        <input {...aria("name", err("name"))} defaultValue={member?.name} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Relationship" name="relationship" required error={err("relationship")}>
          <select {...aria("relationship", err("relationship"))} defaultValue={member?.relationship ?? ""} className={inputCls}>
            <option value="" disabled>Choose…</option>
            {["Mother", "Father", "Child", "Spouse", "Grandparent", "Other"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Gender" name="gender" required error={err("gender")}>
          <select {...aria("gender", err("gender"))} defaultValue={member?.gender ?? ""} className={inputCls}>
            <option value="" disabled>Choose…</option>
            {["Female", "Male", "Other"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Date of birth" name="dateOfBirth" required error={err("dateOfBirth")}>
        <input {...aria("dateOfBirth", err("dateOfBirth"))} type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={member?.dateOfBirth} className={inputCls} />
      </Field>
      <Field label="Accessibility needs (optional)" name="accessibilityNeeds" hint="For example: wheelchair user, hard of hearing" error={err("accessibilityNeeds")}>
        <input {...aria("accessibilityNeeds", err("accessibilityNeeds"), true)} defaultValue={member?.accessibilityNeeds ?? ""} maxLength={200} className={inputCls} />
      </Field>
      <SubmitButton pending={isPending} disabled={!v.valid}>{member ? "Save changes" : "Add family member"}</SubmitButton>
    </form>
  );
}

export function FamilyManager({ members }: { members: Member[] }) {
  const { toast } = useApp();
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [pending, start] = useTransition();
  const close = useCallback(() => setEditing(null), []);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button type="button" className={btn.primary} onClick={() => setEditing("new")}><Plus size={16} aria-hidden="true" /> Add family member</button>
      </div>
      {members.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-soft p-10 text-center text-ink-2">No family members yet. Add your parents or children to book visits for them.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Your family members</caption>
            <thead className="bg-soft text-ink-2">
              <tr><th scope="col" className="px-5 py-3 font-medium">Name</th><th scope="col" className="px-5 py-3 font-medium">Relationship</th><th scope="col" className="px-5 py-3 font-medium">Age</th><th scope="col" className="px-5 py-3 font-medium">Accessibility needs</th><th scope="col" className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <th scope="row" className="px-5 py-4 font-medium">{m.name}</th>
                  <td className="px-5 py-4">{m.relationship}</td>
                  <td className="px-5 py-4">{age(m.dateOfBirth)} yrs · {m.gender}</td>
                  <td className="px-5 py-4">{m.accessibilityNeeds || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button type="button" className={btn.ghost} onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}><Pencil size={16} aria-hidden="true" /> Edit</button>
                      <button type="button" className={btn.ghost} onClick={() => setDeleting(m)} aria-label={`Delete ${m.name}`}><Trash2 size={16} aria-hidden="true" /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editing !== null} onClose={close} title={editing === "new" || editing === null ? "Add a family member" : `Edit ${editing.name}`}>
        {editing !== null && <MemberForm member={editing === "new" ? undefined : editing} onDone={close} />}
      </Dialog>
      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title={`Delete ${deleting?.name}?`}>
        <p className="text-ink-2">This removes them from your account. Past appointments stay in your history.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setDeleting(null)}>Keep</button>
          <button type="button" disabled={pending} className={btn.danger} onClick={() => start(async () => {
            const r = await deleteFamilyMemberAction(deleting!.id);
            toast(r.message ?? "", r.ok ? "success" : "error");
            setDeleting(null);
          })}>Delete</button>
        </div>
      </Dialog>
    </>
  );
}
