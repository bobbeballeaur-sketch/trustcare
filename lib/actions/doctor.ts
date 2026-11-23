"use server";
// Doctor actions: registration, profile, appointment decisions, weekly hours,
// leave (with automatic cancellations) and replies to reviews.
// SECURITY: every action re-checks on the server that the appointment,
// block, leave or review belongs to the logged-in doctor.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, type CurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { formatDateLong, formatMinute, minutesUntil, nowInIndia, parseTime } from "@/lib/time";
import { blockSchema, doctorProfileSchema, fieldErrors, leaveSchema, reasonSchema, type FormState } from "@/lib/validation";

function readProfile(fd: FormData) {
  const bool = (k: string) => fd.get(k) === "on" || fd.get(k) === "true";
  return {
    qualifications: fd.get("qualifications"), specialisationId: fd.get("specialisationId"), experienceYears: fd.get("experienceYears"),
    gender: fd.get("gender"), languages: fd.getAll("languages"), bio: fd.get("bio"),
    registrationNumber: fd.get("registrationNumber"), stateMedicalCouncil: fd.get("stateMedicalCouncil"), registrationYear: fd.get("registrationYear"),
    clinicName: fd.get("clinicName"), clinicAddress: fd.get("clinicAddress"), areaId: fd.get("areaId"), pinCode: fd.get("pinCode"),
    clinicPhone: fd.get("clinicPhone"), fee: fd.get("fee"), acceptsAyushman: bool("acceptsAyushman"),
    ramp: bool("ramp"), lift: bool("lift"), accessibleWashroom: bool("accessibleWashroom"), groundFloor: bool("groundFloor"),
    signLanguage: bool("signLanguage"), textBooking: bool("textBooking"), homeVisits: bool("homeVisits"),
    offersVideo: bool("offersVideo"), videoFee: fd.get("videoFee") ? fd.get("videoFee") : undefined,
    consent: bool("consent") ? true : undefined,
  };
}

async function notifyAdmins(title: string, message: string, link: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  for (const a of admins) await notify(a.id, title, message, link);
}

/** Step 2 of doctor sign-up, and resubmitting after a rejection. */
export async function submitRegistrationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const parsed = doctorProfileSchema.safeParse(readProfile(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { consent, ...data } = parsed.data;
  void consent;
  const existing = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (existing && existing.verificationStatus === "VERIFIED") return { message: "Your profile is already verified. Edit it from My profile." };
  const values = { ...data, verificationStatus: "PENDING" as const, rejectionReason: null };
  if (existing) await db.doctorProfile.update({ where: { id: existing.id }, data: values });
  else await db.doctorProfile.create({ data: { ...values, userId: user.id } });
  await notifyAdmins("New doctor to verify", `${user.name} submitted registration ${data.registrationNumber}.`, "/admin/doctors");
  redirect("/doctor");
}

/** Edit profile. Changing registration details sends the profile back to Pending. */
export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const parsed = doctorProfileSchema.safeParse(readProfile(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { consent, ...data } = parsed.data;
  void consent;
  const p = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!p) return { message: "Please complete your registration first." };
  const regChanged = p.registrationNumber !== data.registrationNumber || p.stateMedicalCouncil !== data.stateMedicalCouncil || p.registrationYear !== data.registrationYear;
  await db.doctorProfile.update({
    where: { id: p.id },
    data: { ...data, ...(regChanged ? { verificationStatus: "PENDING", verifiedAt: null } : {}) },
  });
  if (regChanged) {
    await notifyAdmins("Doctor needs re-verification", `${user.name} changed their registration details.`, "/admin/doctors");
    redirect("/doctor");
  }
  revalidatePath("/doctor/profile");
  return { ok: true, message: "Profile saved." };
}

/** Makes sure the logged-in user is a verified doctor; returns their profile id. */
async function myVerifiedProfile(user: CurrentUser) {
  const p = user.doctorProfile;
  if (!p || p.verificationStatus !== "VERIFIED") throw new Error("Your profile must be verified first.");
  return p.id;
}

/* ---------------- Appointment decisions ---------------- */
type Decision = "accept" | "decline" | "complete" | "noshow" | "cancel";

export async function decideAppointmentAction(appointmentId: string, decision: Decision, reason = ""): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const appt = await db.appointment.findUnique({ where: { id: appointmentId }, include: { patient: true } });
  // DEMO TRAP 5: Doctor A can't touch Doctor B's appointments, even by changing the ID.
  if (!appt || appt.doctorId !== doctorId) return { message: "403: You can only manage your own appointments." };

  const when = `${formatDateLong(appt.date)}, ${formatMinute(appt.startMinute)}`;
  const started = minutesUntil(appt.date, appt.startMinute) <= 0;

  if (decision === "accept") {
    if (appt.status !== "REQUESTED") return { message: "Only requested appointments can be accepted." };
    if (started) return { message: "This time has already passed." };
    await db.appointment.update({ where: { id: appt.id }, data: { status: "CONFIRMED" } });
    await notify(appt.patientId, "Appointment confirmed", `${user.name} confirmed your visit on ${when}.`, "/patient/appointments");
  } else if (decision === "decline") {
    if (appt.status !== "REQUESTED") return { message: "Only requested appointments can be declined." };
    const r = reasonSchema.safeParse(reason);
    if (!r.success) return { message: r.error.issues[0].message };
    await db.appointment.update({ where: { id: appt.id }, data: { status: "DECLINED", cancelReason: r.data, cancelledBy: "DOCTOR", ...(appt.paymentStatus === "PAID" ? { paymentStatus: "REFUNDED" as const } : {}) } });
    await notify(appt.patientId, "Appointment declined", `${user.name} couldn't take your visit on ${when}: ${r.data}`, `/doctors/${doctorId}#book`);
  } else if (decision === "complete" || decision === "noshow") {
    if (appt.status !== "CONFIRMED") return { message: "Only confirmed appointments can be marked." };
    if (!started) return { message: "You can mark this only after the appointment time has passed." };
    await db.appointment.update({ where: { id: appt.id }, data: { status: decision === "complete" ? "COMPLETED" : "NO_SHOW" } });
    if (decision === "complete")
      await notify(appt.patientId, "How was your visit?", `Share a review of ${user.name} to help others.`, "/patient/appointments?tab=past");
  } else if (decision === "cancel") {
    if (appt.status !== "CONFIRMED" && appt.status !== "REQUESTED") return { message: "This appointment can't be cancelled." };
    const r = reasonSchema.safeParse(reason);
    if (!r.success) return { message: r.error.issues[0].message };
    await db.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED", cancelReason: r.data, cancelledBy: "DOCTOR", ...(appt.paymentStatus === "PAID" ? { paymentStatus: "REFUNDED" as const } : {}) } });
    await notify(appt.patientId, "Appointment cancelled by doctor", `${user.name} cancelled your visit on ${when}: ${r.data}`, `/doctors/${doctorId}#book`);
  }
  revalidatePath("/doctor/appointments");
  revalidatePath("/doctor");
  const done = { accept: "Accepted — the patient has been notified.", decline: "Declined — the patient has been notified.", complete: "Marked as completed.", noshow: "Marked as no-show.", cancel: "Cancelled — the patient has been notified." };
  return { ok: true, message: done[decision] };
}

/* ---------------- Weekly hours (Create, Update, Delete) ---------------- */
export async function saveBlockAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const parsed = blockSchema.safeParse({ dayOfWeek: fd.get("dayOfWeek"), start: fd.get("start"), end: fd.get("end") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const startMinute = parseTime(parsed.data.start), endMinute = parseTime(parsed.data.end);
  if (startMinute % 15 || endMinute % 15) return { errors: { start: "Use times on the quarter hour (e.g. 10:00, 10:15)." }, message: "Times must be on 15-minute steps." };
  if (endMinute - startMinute < 15) return { errors: { end: "A block must be at least 15 minutes." } };
  const id = fd.get("id") as string | null;
  const overlap = await db.availabilityBlock.findFirst({
    where: { doctorId, dayOfWeek: parsed.data.dayOfWeek, startMinute: { lt: endMinute }, endMinute: { gt: startMinute }, NOT: id ? { id } : undefined },
  });
  if (overlap) return { message: "This overlaps another block on the same day." };
  if (id) {
    const mine = await db.availabilityBlock.findFirst({ where: { id, doctorId } });
    if (!mine) return { message: "You can only edit your own hours." };
    await db.availabilityBlock.update({ where: { id }, data: { dayOfWeek: parsed.data.dayOfWeek, startMinute, endMinute } });
  } else {
    await db.availabilityBlock.create({ data: { doctorId, dayOfWeek: parsed.data.dayOfWeek, startMinute, endMinute } });
  }
  revalidatePath("/doctor/availability");
  return { ok: true, message: id ? "Hours updated." : "Hours added." };
}

export async function deleteBlockAction(id: string): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const mine = await db.availabilityBlock.findFirst({ where: { id, doctorId } });
  if (!mine) return { message: "You can only delete your own hours." };
  await db.availabilityBlock.delete({ where: { id } });
  revalidatePath("/doctor/availability");
  return { ok: true, message: "Hours removed. Existing bookings are not affected." };
}

/* ---------------- Leave (Create, Update, Delete) ---------------- */
/** How many active bookings a leave period would cancel (shown before saving). */
export async function leaveImpactAction(fromDate: string, toDate: string) {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  if (!fromDate || !toDate || toDate < fromDate) return 0;
  return db.appointment.count({ where: { doctorId, date: { gte: fromDate, lte: toDate }, status: { in: ["REQUESTED", "CONFIRMED"] } } });
}

export async function saveLeaveAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const parsed = leaveSchema.safeParse({ fromDate: fd.get("fromDate"), toDate: fd.get("toDate"), reason: (fd.get("reason") as string) || undefined });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const { date: today } = nowInIndia();
  if (parsed.data.fromDate < today) return { errors: { fromDate: "Leave can't start in the past." } };
  const id = fd.get("id") as string | null;
  if (id) {
    const mine = await db.leave.findFirst({ where: { id, doctorId } });
    if (!mine) return { message: "You can only edit your own leave." };
    await db.leave.update({ where: { id }, data: parsed.data });
  } else {
    await db.leave.create({ data: { ...parsed.data, doctorId } });
  }

  // Cancel every Requested/Confirmed booking in the leave period and tell each patient.
  const affected = await db.appointment.findMany({
    where: { doctorId, date: { gte: parsed.data.fromDate, lte: parsed.data.toDate }, status: { in: ["REQUESTED", "CONFIRMED"] } },
  });
  for (const a of affected) {
    await db.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledBy: "SYSTEM", cancelReason: "Doctor on leave", ...(a.paymentStatus === "PAID" ? { paymentStatus: "REFUNDED" as const } : {}) } });
    await notify(a.patientId, `${user.name} is on leave`, `Your visit on ${formatDateLong(a.date)}, ${formatMinute(a.startMinute)} was cancelled because the doctor is on leave. Tap Rebook to choose another time.`, `/doctors/${doctorId}#book`);
  }
  revalidatePath("/doctor/availability");
  return { ok: true, message: affected.length ? `Leave saved. ${affected.length} appointment${affected.length > 1 ? "s were" : " was"} cancelled and the patients were notified.` : "Leave saved." };
}

export async function deleteLeaveAction(id: string): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const mine = await db.leave.findFirst({ where: { id, doctorId } });
  if (!mine) return { message: "You can only delete your own leave." };
  await db.leave.delete({ where: { id } });
  revalidatePath("/doctor/availability");
  return { ok: true, message: "Leave removed. Cancelled appointments stay cancelled; patients can rebook." };
}

/* ---------------- Replies to reviews (Create/Update, Delete) ---------------- */
export async function replyToReviewAction(reviewId: string, text: string): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review || review.doctorId !== doctorId) return { message: "You can only reply to reviews of your own profile." };
  const reply = text.trim();
  if (reply.length < 2) return { message: "Write a reply first." };
  if (reply.length > 300) return { message: "Replies can be up to 300 characters." };
  const isNew = !review.doctorReply;
  await db.review.update({ where: { id: reviewId }, data: { doctorReply: reply } });
  if (isNew) await notify(review.patientId, "The doctor replied to your review", `${user.name}: “${reply.slice(0, 80)}”`, "/patient/reviews");
  revalidatePath("/doctor/reviews");
  return { ok: true, message: isNew ? "Reply posted." : "Reply updated." };
}

export async function deleteReplyAction(reviewId: string): Promise<FormState> {
  const user = await requireRole(["DOCTOR"]);
  const doctorId = await myVerifiedProfile(user);
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review || review.doctorId !== doctorId) return { message: "You can only manage replies on your own profile." };
  await db.review.update({ where: { id: reviewId }, data: { doctorReply: null } });
  revalidatePath("/doctor/reviews");
  return { ok: true, message: "Reply deleted." };
}
