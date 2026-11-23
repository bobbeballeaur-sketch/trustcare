// One conversation.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";
import { formatDateLong, formatMinute } from "@/lib/time";
import { RoleShell } from "@/components/role-shell";
import { PageTitle, StatusBadge } from "@/components/shell";
import { Chat } from "@/components/consult/chat";
import { ModeBadge, PayBadge } from "@/components/consult/badges";

export const metadata = { title: "Conversation" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${id}`);
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok) notFound();
  const { a, isDoctor } = ok;
  const other = isDoctor ? a.patient.name : a.doctor.user.name;
  const canCall = a.mode === "VIDEO" && a.status === "CONFIRMED" && a.paymentStatus === "PAID";
  return (
    <RoleShell role={user.role}>
      <PageTitle eyebrow="Conversation" title={other} sub={`${formatDateLong(a.date)}, ${formatMinute(a.startMinute)}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} /><ModeBadge mode={a.mode} /><PayBadge status={a.paymentStatus} fee={a.fee} />
          {canCall && <Link href={`/consult/${a.id}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white"><Video size={16} aria-hidden="true" /> Join video call</Link>}
          {!isDoctor && a.paymentStatus === "UNPAID" && ["REQUESTED", "CONFIRMED"].includes(a.status) && <Link href={`/pay/${a.id}`} className="inline-flex h-11 items-center rounded-full border border-[#cfc9bf] px-5 text-sm font-medium">Pay ₹{a.fee}</Link>}
        </div>
      </PageTitle>
      <div className="h-[65vh]"><Chat appointmentId={a.id} closed={["CANCELLED", "DECLINED"].includes(a.status)} /></div>
    </RoleShell>
  );
}
