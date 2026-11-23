// Messages: one conversation per appointment, for patients and doctors.
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDateShort, formatMinute, nowInIndia, addDays } from "@/lib/time";
import { RoleShell } from "@/components/role-shell";
import { PageTitle, EmptyState } from "@/components/shell";
import { ModeBadge } from "@/components/consult/badges";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireRole(["PATIENT", "DOCTOR"], "/messages");
  const { date: today } = nowInIndia();
  const mine = user.role === "DOCTOR" ? { doctor: { userId: user.id } } : { patientId: user.id };
  const appts = await db.appointment.findMany({
    where: { ...mine, OR: [{ messages: { some: {} } }, { status: { in: ["REQUESTED", "CONFIRMED"] }, date: { gte: today } }, { status: "COMPLETED", date: { gte: addDays(today, -14) } }] },
    include: { patient: { select: { name: true } }, doctor: { include: { user: { select: { name: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  appts.sort((a, b) => (b.messages[0]?.createdAt.getTime() ?? 0) - (a.messages[0]?.createdAt.getTime() ?? 0));
  return (
    <RoleShell role={user.role}>
      <AutoRefresh every={5000} />
      <PageTitle eyebrow="Messages" title="Conversations" sub="Chat about an appointment. Video consultations open from here too." />
      {appts.length === 0 ? <EmptyState title="No conversations yet" text="Book an appointment to chat with your doctor." href="/doctors" cta="Find a doctor" /> : (
        <ul className="flex flex-col gap-2">
          {appts.map((a) => (
            <li key={a.id}>
              <Link href={`/messages/${a.id}`} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white p-4 hover:bg-soft">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{user.role === "DOCTOR" ? a.patient.name : a.doctor.user.name}</span>
                  <span className="block truncate text-sm text-ink-2">{a.messages[0] ? a.messages[0].text : "No messages yet"}</span>
                </span>
                <span className="text-sm text-ink-2">{formatDateShort(a.date)}, {formatMinute(a.startMinute)}</span>
                <ModeBadge mode={a.mode} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RoleShell>
  );
}
