// Video consultation room: video call + chat side by side.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";
import { formatDateLong, formatMinute } from "@/lib/time";
import { RoleShell } from "@/components/role-shell";
import { PageTitle } from "@/components/shell";
import { VideoCall } from "@/components/consult/video-call";
import { Chat } from "@/components/consult/chat";

export const metadata = { title: "Video consultation" };

export default async function ConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/consult/${id}`);
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok) notFound();
  const { a, isDoctor } = ok;
  const other = isDoctor ? (a.familyMember ? `${a.familyMember.name} (via ${a.patient.name})` : a.patient.name) : a.doctor.user.name;
  const ready = a.mode === "VIDEO" && a.status === "CONFIRMED" && a.paymentStatus === "PAID";
  return (
    <RoleShell role={user.role}>
      <PageTitle eyebrow="Video consultation" title={`With ${other}`} sub={`${formatDateLong(a.date)}, ${formatMinute(a.startMinute)} · ${a.doctor.specialisation.simpleName}`} />
      {!ready ? (
        <div className="rounded-3xl bg-warn-soft p-6 text-warn">
          <p className="font-semibold">The video call isn&apos;t open yet.</p>
          <p className="mt-1 text-ink">{a.mode !== "VIDEO" ? "This is an in-clinic appointment." : a.status !== "CONFIRMED" ? "The doctor needs to confirm the appointment first." : "The consultation fee needs to be paid first."}</p>
          {!isDoctor && a.mode === "VIDEO" && a.paymentStatus !== "PAID" && <Link href={`/pay/${a.id}`} className="mt-4 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Pay ₹{a.fee} now</Link>}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div>
            <VideoCall appointmentId={a.id} isDoctor={isDoctor} otherName={other} />
            <p className="mt-3 text-sm text-ink-2">
              The call connects your two browsers directly. If it can&apos;t connect on your network, use the{" "}
              <a href={`https://meet.jit.si/TrustCare-${a.id}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">backup video room</a>.
            </p>
          </div>
          <Chat appointmentId={a.id} />
        </div>
      )}
    </RoleShell>
  );
}
