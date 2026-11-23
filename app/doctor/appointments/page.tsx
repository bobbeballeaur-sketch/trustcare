// Doctor: all appointments in a table (cards on phones), with search,
// status/date filters and sorting. New requests appear live.
import Link from "next/link";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireVerifiedDoctor } from "@/lib/doctor-guard";
import { formatDateShort, formatMinute, minutesUntil } from "@/lib/time";
import { Portal, DOCTOR_LINKS } from "@/components/portal";
import { PageTitle, StatusBadge } from "@/components/shell";
import { AutoRefresh } from "@/components/auto-refresh";
import { DoctorApptActions } from "@/components/doctor/appt-actions";
import { ModeBadge, PayBadge } from "@/components/consult/badges";

export const metadata = { title: "Appointments" };
const STATUSES: AppointmentStatus[] = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "DECLINED", "NO_SHOW"];

type SP = { q?: string; status?: string; from?: string; to?: string; sort?: string };

export default async function DoctorAppointments({ searchParams }: { searchParams: Promise<SP> }) {
  const { doctorId } = await requireVerifiedDoctor("/doctor/appointments");
  const sp = await searchParams;
  const where: Prisma.AppointmentWhereInput = { doctorId };
  if (sp.q) where.OR = [{ patient: { name: { contains: sp.q, mode: "insensitive" } } }, { familyMember: { name: { contains: sp.q, mode: "insensitive" } } }];
  if (sp.status && STATUSES.includes(sp.status as AppointmentStatus)) where.status = sp.status as AppointmentStatus;
  if (sp.from || sp.to) where.date = { ...(sp.from ? { gte: sp.from } : {}), ...(sp.to ? { lte: sp.to } : {}) };
  const dir = sp.sort === "asc" ? "asc" : "desc";
  const appts = await db.appointment.findMany({
    where,
    orderBy: [{ date: dir }, { startMinute: dir }],
    take: 100,
    include: { patient: { select: { name: true, phone: true } }, familyMember: true },
  });
  const pendingCount = await db.appointment.count({ where: { doctorId, status: "REQUESTED" } });
  const input = "h-11 rounded-xl border border-[#cfc9bf] bg-white px-3 text-sm";

  return (
    <Portal title="Doctor portal" links={DOCTOR_LINKS}>
      <AutoRefresh />
      <PageTitle eyebrow="Doctor portal" title="Appointments" sub={`${pendingCount} request${pendingCount === 1 ? "" : "s"} waiting for your reply. This page updates live.`} />
      <form role="search" aria-label="Filter appointments" className="mb-5 flex flex-wrap items-end gap-3 rounded-3xl border border-line bg-white p-4">
        <label className="flex flex-[1_1_200px] flex-col gap-1 text-sm font-medium">Patient name<input name="q" defaultValue={sp.q} className={`${input} font-normal`} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Status
          <select name="status" defaultValue={sp.status ?? ""} className={`${input} font-normal`}>
            <option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", "-").toLowerCase()}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">From<input type="date" name="from" defaultValue={sp.from} className={`${input} font-normal`} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">To<input type="date" name="to" defaultValue={sp.to} className={`${input} font-normal`} /></label>
        <label className="flex flex-col gap-1 text-sm font-medium">Sort
          <select name="sort" defaultValue={dir} className={`${input} font-normal`}><option value="desc">Newest date first</option><option value="asc">Oldest date first</option></select>
        </label>
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-medium text-white">Apply</button>
        <Link href="/doctor/appointments" className="h-11 px-3 py-3 text-sm underline">Clear</Link>
      </form>

      {/* Table on larger screens */}
      <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Your appointments</caption>
          <thead className="bg-soft text-ink-2">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Patient</th>
              <th scope="col" className="px-4 py-3 font-medium">Reason & access needs</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {appts.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateShort(a.date)}<br /><span className="font-normal text-ink-2">{formatMinute(a.startMinute)}</span></td>
                <td className="px-4 py-4">{a.familyMember ? <>{a.familyMember.name} <span className="text-ink-2">({a.familyMember.relationship} of {a.patient.name})</span></> : a.patient.name}</td>
                <td className="max-w-[260px] px-4 py-4">
                  {a.reasonForVisit ?? <span className="text-ink-2">Not shared</span>}
                  {a.accessibilityNote && <span className="mt-1 block rounded-lg bg-info-soft px-2 py-1 text-xs">♿ {a.accessibilityNote}</span>}
                  {a.cancelReason && <span className="mt-1 block text-xs text-ink-2">Reason: {a.cancelReason}</span>}
                </td>
                <td className="px-4 py-4"><div className="flex flex-col items-start gap-1"><StatusBadge status={a.status} /><ModeBadge mode={a.mode} /><PayBadge status={a.paymentStatus} fee={a.fee} /></div></td>
                <td className="px-4 py-4">
                  <DoctorApptActions id={a.id} status={a.status} past={minutesUntil(a.date, a.startMinute) <= 0} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Link href={`/messages/${a.id}`} className="inline-flex min-h-10 items-center rounded-full border border-[#cfc9bf] px-3 text-xs font-medium">💬 Chat</Link>
                    {a.mode === "VIDEO" && a.status === "CONFIRMED" && a.paymentStatus === "PAID" && <Link href={`/consult/${a.id}`} className="inline-flex min-h-10 items-center rounded-full bg-[#4b2a8a] px-3 text-xs font-medium text-white">🎥 Start video call</Link>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appts.length === 0 && <p className="p-6 text-ink-2">No appointments match.</p>}
      </div>

      {/* Cards on phones */}
      <ul className="flex flex-col gap-3 md:hidden">
        {appts.map((a) => (
          <li key={a.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{formatDateShort(a.date)}, {formatMinute(a.startMinute)}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-1">{a.familyMember ? `${a.familyMember.name} (via ${a.patient.name})` : a.patient.name}</p>
            <p className="text-sm text-ink-2">{a.reasonForVisit ?? "Reason not shared"}</p>
            {a.accessibilityNote && <p className="mt-1 rounded-lg bg-info-soft px-2 py-1 text-xs">♿ {a.accessibilityNote}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5"><ModeBadge mode={a.mode} /><PayBadge status={a.paymentStatus} fee={a.fee} /></div>
            <div className="mt-3"><DoctorApptActions id={a.id} status={a.status} past={minutesUntil(a.date, a.startMinute) <= 0} /></div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link href={`/messages/${a.id}`} className="inline-flex min-h-10 items-center rounded-full border border-[#cfc9bf] px-3 text-xs font-medium">💬 Chat</Link>
              {a.mode === "VIDEO" && a.status === "CONFIRMED" && a.paymentStatus === "PAID" && <Link href={`/consult/${a.id}`} className="inline-flex min-h-10 items-center rounded-full bg-[#4b2a8a] px-3 text-xs font-medium text-white">🎥 Start video call</Link>}
            </div>
          </li>
        ))}
      </ul>
    </Portal>
  );
}
