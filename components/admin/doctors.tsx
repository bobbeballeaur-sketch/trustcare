"use client";
// Doctor verification queue and the list of all doctors.
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { approveDoctorAction, rejectDoctorAction, revokeDoctorAction } from "@/lib/actions/admin";
import { DataTable, type Column } from "./data-table";
import { ActionButton, ReasonButton } from "./reason-button";
import { btn } from "../shell-buttons";

export type AdminDoctor = {
  id: string; name: string; email: string; spec: string; qualifications: string; registrationNumber: string; council: string; year: number;
  status: string; submitted: string; area: string; clinic: string; fee: number; experience: number; languages: string; bio: string;
  verifiedAt: string | null; verifiedBy: string | null; rejectionReason: string | null;
};

const NMC_URL = "https://www.nmc.org.in/information-desk/indian-medical-register/";

export function VerificationQueue({ pending }: { pending: AdminDoctor[] }) {
  const [open, setOpen] = useState<string | null>(pending[0]?.id ?? null);
  if (pending.length === 0) return <p className="rounded-3xl border border-dashed border-line bg-soft p-8 text-center text-ink-2">No doctors waiting for verification. 🎉</p>;
  return (
    <ul className="flex flex-col gap-3">
      {pending.map((d) => (
        <li key={d.id} className="rounded-3xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-medium">{d.name}</p>
              <p className="text-sm text-ink-2">{d.spec} · Reg. <b className="text-ink">{d.registrationNumber}</b> · {d.council} · {d.year} · submitted {d.submitted}</p>
            </div>
            <button type="button" className={btn.ghost} aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? "Hide details" : "View details"}</button>
          </div>
          {open === d.id && (
            <div className="mt-4 border-t border-line pt-4">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[["Email", d.email], ["Qualifications", d.qualifications], ["Experience", `${d.experience} years`], ["Languages", d.languages], ["Clinic", `${d.clinic}, ${d.area}`], ["Fee", `₹${d.fee}`]].map(([k, v]) => (
                  <div key={k}><dt className="text-ink-2">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
                <div className="sm:col-span-2"><dt className="text-ink-2">Bio</dt><dd>{d.bio}</dd></div>
              </dl>
              <div className="mt-4 rounded-2xl bg-soft p-4 text-sm">
                <p className="font-medium">How to check</p>
                <ol className="mt-1 list-decimal pl-5 text-ink-2">
                  <li>Open the NMC Indian Medical Register.</li>
                  <li>Search registration number <b className="text-ink">{d.registrationNumber}</b>.</li>
                  <li>Compare the name (<b className="text-ink">{d.name}</b>), council (<b className="text-ink">{d.council}</b>) and year (<b className="text-ink">{d.year}</b>).</li>
                </ol>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={NMC_URL} target="_blank" rel="noopener noreferrer" className={btn.secondary}>Open NMC Indian Medical Register <ExternalLink size={15} aria-hidden="true" /></a>
                <ActionButton label="Approve" run={() => approveDoctorAction(d.id)} />
                <ReasonButton label="Reject" title={`Reject ${d.name}?`} confirmLabel="Reject" variant="danger" run={(r) => rejectDoctorAction(d.id, r)} help="The doctor will see this reason and can edit and resubmit." />
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AllDoctors({ doctors }: { doctors: AdminDoctor[] }) {
  const columns: Column<AdminDoctor>[] = [
    { key: "name", header: "Doctor", sortValue: (d) => d.name, render: (d) => <><b className="font-medium">{d.name}</b><br /><span className="text-ink-2">{d.email}</span></> },
    { key: "spec", header: "Specialisation", sortValue: (d) => d.spec, render: (d) => d.spec },
    { key: "reg", header: "Registration", sortValue: (d) => d.registrationNumber, render: (d) => <>{d.registrationNumber}<br /><span className="text-ink-2">{d.year}</span></> },
    { key: "status", header: "Status", sortValue: (d) => d.status, render: (d) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${d.status === "VERIFIED" ? "bg-ok-soft text-ok" : d.status === "PENDING" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger"}`}>{d.status === "VERIFIED" ? "✓ " : d.status === "PENDING" ? "⏳ " : "✕ "}{d.status.toLowerCase()}</span> },
    { key: "verified", header: "Verified", sortValue: (d) => d.verifiedAt ?? "", render: (d) => d.verifiedAt ? <>{d.verifiedAt}<br /><span className="text-ink-2">by {d.verifiedBy}</span></> : "—" },
    { key: "actions", header: "Actions", render: (d) => d.status === "VERIFIED" ? <ReasonButton label="Revoke" title={`Revoke ${d.name}?`} confirmLabel="Revoke verification" variant="danger" run={(r) => revokeDoctorAction(d.id, r)} help="The doctor will be hidden from search and their future appointments cancelled with notifications." /> : <span className="text-ink-2">—</span> },
  ];
  return (
    <DataTable
      caption="All doctors"
      rows={doctors}
      columns={columns}
      searchText={(d) => `${d.name} ${d.email} ${d.registrationNumber} ${d.spec}`}
      filters={[{ key: "status", label: "Status", options: ["VERIFIED", "PENDING", "REJECTED", "REVOKED"], value: (d) => d.status }]}
    />
  );
}
