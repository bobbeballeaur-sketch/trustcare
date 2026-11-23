"use server";
// Free slots for one doctor (used by the reschedule pop-up).
import { db } from "@/lib/db";
import { generateSlots, nowInIndia } from "@/lib/time";

export async function getSlotsAction(doctorId: string) {
  const { date: today } = nowInIndia();
  const [blocks, leaves, taken] = await Promise.all([
    db.availabilityBlock.findMany({ where: { doctorId } }),
    db.leave.findMany({ where: { doctorId, toDate: { gte: today } } }),
    db.appointment.findMany({ where: { doctorId, date: { gte: today }, status: { in: ["REQUESTED", "CONFIRMED"] } }, select: { date: true, startMinute: true } }),
  ]);
  return generateSlots(blocks, leaves, taken);
}
