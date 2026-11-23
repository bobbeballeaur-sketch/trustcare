// Who may open an appointment's chat, video call or payment.
import "server-only";
import { db } from "./db";
import type { CurrentUser } from "./auth";

/** SECURITY: only the patient who booked and the appointment's doctor. */
export async function getAppointmentForParticipant(user: CurrentUser | null, appointmentId: string) {
  if (!user) return null;
  const a = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { select: { id: true, name: true } }, familyMember: true, doctor: { include: { user: { select: { id: true, name: true } }, specialisation: true } } },
  });
  if (!a) return null;
  const isPatient = a.patientId === user.id;
  const isDoctor = a.doctor.userId === user.id;
  if (!isPatient && !isDoctor) return null;
  return { a, isPatient, isDoctor };
}
