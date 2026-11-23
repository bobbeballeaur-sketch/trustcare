// Doctor: weekly hours and leave.
import { db } from "@/lib/db";
import { requireVerifiedDoctor } from "@/lib/doctor-guard";
import { nowInIndia } from "@/lib/time";
import { Portal, DOCTOR_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { AvailabilityManager } from "@/components/doctor/availability";

export const metadata = { title: "Availability & leave" };

export default async function AvailabilityPage() {
  const { doctorId } = await requireVerifiedDoctor("/doctor/availability");
  const { date: today } = nowInIndia();
  const [blocks, leaves] = await Promise.all([
    db.availabilityBlock.findMany({ where: { doctorId } }),
    db.leave.findMany({ where: { doctorId, toDate: { gte: today } }, orderBy: { fromDate: "asc" } }),
  ]);
  return (
    <Portal title="Doctor portal" links={DOCTOR_LINKS}>
      <PageTitle eyebrow="Doctor portal" title="Availability & leave" sub="Your weekly hours create the 15-minute slots patients can book for the next 14 days." />
      <AvailabilityManager
        blocks={blocks.map(({ id, dayOfWeek, startMinute, endMinute }) => ({ id, dayOfWeek, startMinute, endMinute }))}
        leaves={leaves.map(({ id, fromDate, toDate, reason }) => ({ id, fromDate, toDate, reason }))}
        today={today}
      />
    </Portal>
  );
}
