// Admin: all patients and doctors, with suspend / reactivate.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Portal, ADMIN_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { UsersTable, type AdminUser } from "@/components/admin/users";

export const metadata = { title: "Users" };

export default async function AdminUsers() {
  const admin = await requireRole(["ADMIN"], "/admin/users");
  const users = await db.user.findMany({ include: { doctorProfile: { select: { verificationStatus: true } } }, orderBy: { createdAt: "desc" } });
  const rows: AdminUser[] = users.map((u) => {
    const v = u.doctorProfile?.verificationStatus;
    const status = u.status === "SUSPENDED" ? "Suspended" : v === "PENDING" ? "Pending" : v === "REJECTED" || v === "REVOKED" ? "Rejected" : "Active";
    return { id: u.id, name: u.name, email: u.email, role: u.role, status, joined: u.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), joinedSort: u.createdAt.getTime(), isSelf: u.id === admin.id, reason: u.suspendedReason };
  });
  return (
    <Portal title="Admin" links={ADMIN_LINKS}>
      <PageTitle eyebrow="Admin" title="Users" sub="Suspended users can't log in. You can't suspend yourself." />
      <UsersTable users={rows} />
    </Portal>
  );
}
