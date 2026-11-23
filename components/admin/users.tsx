"use client";
// Admin users table: suspend and reactivate with a reason.
import { setUserStatusAction } from "@/lib/actions/admin";
import { DataTable, type Column } from "./data-table";
import { ReasonButton } from "./reason-button";

export type AdminUser = { id: string; name: string; email: string; role: string; status: string; joined: string; joinedSort: number; isSelf: boolean; reason: string | null };

export function UsersTable({ users }: { users: AdminUser[] }) {
  const columns: Column<AdminUser>[] = [
    { key: "name", header: "Name", sortValue: (u) => u.name, render: (u) => <b className="font-medium">{u.name}</b> },
    { key: "email", header: "Email", sortValue: (u) => u.email, render: (u) => u.email },
    { key: "role", header: "Role", sortValue: (u) => u.role, render: (u) => u.role.toLowerCase() },
    { key: "status", header: "Status", sortValue: (u) => u.status, render: (u) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.status === "Active" ? "bg-ok-soft text-ok" : u.status === "Suspended" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"}`}>{u.status === "Active" ? "✓" : u.status === "Suspended" ? "⊘" : "⏳"} {u.status}</span> },
    { key: "joined", header: "Joined", sortValue: (u) => u.joinedSort, render: (u) => u.joined },
    {
      key: "actions", header: "Actions", render: (u) =>
        u.isSelf || u.role === "ADMIN" ? <span className="text-ink-2">—</span>
        : u.status === "Suspended"
          ? <ReasonButton label="Reactivate" title={`Reactivate ${u.name}?`} confirmLabel="Reactivate" run={(r) => setUserStatusAction(u.id, false, r)} help={u.reason ? `Suspended because: ${u.reason}` : undefined} />
          : <ReasonButton label="Suspend" title={`Suspend ${u.name}?`} confirmLabel="Suspend" variant="danger" run={(r) => setUserStatusAction(u.id, true, r)} help="They won't be able to log in until reactivated." />,
    },
  ];
  return (
    <DataTable
      caption="All users"
      rows={users}
      columns={columns}
      searchText={(u) => `${u.name} ${u.email}`}
      filters={[
        { key: "role", label: "Role", options: ["PATIENT", "DOCTOR", "ADMIN"], value: (u) => u.role },
        { key: "status", label: "Status", options: ["Active", "Suspended", "Pending", "Rejected"], value: (u) => u.status },
      ]}
    />
  );
}
