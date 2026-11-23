"use server";
// Chat messages and demo payments.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";
import { notify } from "@/lib/notify";
import { formatDateLong, formatMinute } from "@/lib/time";
import { fieldErrors, paymentSchema, type FormState } from "@/lib/validation";

export async function sendMessageAction(appointmentId: string, text: string): Promise<FormState> {
  const user = await getCurrentUser();
  const ok = await getAppointmentForParticipant(user, appointmentId);
  // SECURITY: only the two people in this appointment can chat.
  if (!ok || !user) return { message: "You can only message about your own appointments." };
  if (["CANCELLED", "DECLINED"].includes(ok.a.status)) return { message: "This appointment was cancelled, so the chat is closed." };
  const clean = text.trim();
  if (!clean) return { message: "Write a message first." };
  if (clean.length > 1000) return { message: "Messages can be up to 1000 characters." };
  await db.message.create({ data: { appointmentId, senderId: user.id, text: clean } });
  const other = ok.isPatient ? ok.a.doctor.user.id : ok.a.patientId;
  const recent = await db.notification.findFirst({ where: { userId: other, title: "New message", isRead: false, link: `/messages/${appointmentId}` } });
  if (!recent) await notify(other, "New message", `${user.name}: “${clean.slice(0, 80)}”`, `/messages/${appointmentId}`);
  return { ok: true };
}

/** Demo payment: checks the details like a real checkout, but no money moves. */
export async function payAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const appointmentId = fd.get("appointmentId") as string;
  const ok = await getAppointmentForParticipant(user, appointmentId);
  if (!ok || !ok.isPatient) return { message: "You can only pay for your own appointments." };
  if (ok.a.paymentStatus === "PAID") return { message: "This appointment is already paid." };
  if (!["REQUESTED", "CONFIRMED"].includes(ok.a.status)) return { message: "Only upcoming appointments can be paid." };
  const parsed = paymentSchema.safeParse({
    method: fd.get("method"), upiId: fd.get("upiId") || undefined, cardNumber: fd.get("cardNumber") || undefined,
    cardName: fd.get("cardName") || undefined, expiry: fd.get("expiry") || undefined, cvv: fd.get("cvv") || undefined, bank: fd.get("bank") || undefined,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  await new Promise((r) => setTimeout(r, 900)); // pretend to talk to a bank
  const ref = `TC-${Date.now().toString().slice(-8)}`;
  await db.appointment.update({ where: { id: appointmentId }, data: { paymentStatus: "PAID", paidAt: new Date(), paymentRef: ref } });
  await notify(ok.a.doctor.user.id, "Payment received", `${user!.name} paid ₹${ok.a.fee} for ${formatDateLong(ok.a.date)}, ${formatMinute(ok.a.startMinute)} (demo).`, "/doctor/appointments");
  revalidatePath("/patient/appointments");
  return { ok: true, message: `Payment successful. Reference ${ref}.` };
}
