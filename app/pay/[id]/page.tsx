// Demo checkout for an appointment, and the receipt once paid.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";
import { formatDateLong, formatMinute } from "@/lib/time";
import { Shell, PageTitle } from "@/components/shell";
import { PayForm } from "@/components/consult/pay-form";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Payment" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/pay/${id}`);
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok || !ok.isPatient) notFound();
  const { a } = ok;
  const rows: [string, string][] = [
    ["Doctor", a.doctor.user.name],
    ["Consultation", a.mode === "VIDEO" ? "Video consult (online)" : `In clinic — ${a.doctor.clinicName}`],
    ["Patient", a.familyMember ? `${a.familyMember.name} (${a.familyMember.relationship})` : a.patient.name],
    ["When", `${formatDateLong(a.date)}, ${formatMinute(a.startMinute)}`],
    ["Amount", `₹${a.fee}`],
  ];
  return (
    <Shell>
      <PageTitle eyebrow="Payment (demo)" title={a.paymentStatus === "PAID" ? "Payment receipt" : "Pay for your appointment"} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="sum-h" className="h-fit rounded-3xl border border-line bg-white p-6">
          <h2 id="sum-h" className="mb-4 text-lg font-medium">Summary</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-ink-2">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          {a.paymentStatus === "PAID" && (
            <div className="mt-5 rounded-2xl bg-ok-soft p-4 text-ok">
              <p className="font-semibold">✓ Paid on {a.paidAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
              <p className="text-sm">Reference {a.paymentRef} · demo payment, no real money</p>
            </div>
          )}
          {a.paymentStatus === "REFUNDED" && <p className="mt-5 rounded-2xl bg-info-soft p-4">↩ Refunded because the appointment was cancelled (demo).</p>}
        </section>
        <section aria-labelledby="pay-h" className="rounded-3xl border border-line bg-white p-6">
          <h2 id="pay-h" className="mb-4 text-lg font-medium">{a.paymentStatus === "PAID" ? "What next?" : "Payment details"}</h2>
          {a.paymentStatus === "PAID" ? (
            <div className="flex flex-wrap gap-2">
              {a.mode === "VIDEO" && <Link href={`/consult/${a.id}`} className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Go to video consultation</Link>}
              <Link href="/patient/appointments" className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">My appointments</Link>
              <PrintButton />
            </div>
          ) : ["REQUESTED", "CONFIRMED"].includes(a.status) ? (
            <PayForm appointmentId={a.id} amount={a.fee} />
          ) : (
            <p className="text-ink-2">This appointment can no longer be paid.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
