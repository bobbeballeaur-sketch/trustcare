"use server";
// Patient actions: saved doctors, family members (full CRUD), booking,
// rescheduling, cancelling, reviews (full CRUD) and reporting reviews.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { recomputeRating } from "@/lib/demo-data";
import { notify } from "@/lib/notify";
import { BOOKING_WINDOW_DAYS, addDays, dayOfWeek, formatDateLong, formatMinute, minutesUntil, nowInIndia } from "@/lib/time";
import { bookingSchema, familyMemberSchema, fieldErrors, reviewSchema, type FormState } from "@/lib/validation";
import { Prisma } from "@prisma/client";

/** Demo refund: a paid appointment that is cancelled is marked as refunded. */
function refundIfPaid(status: string) {
  return status === "PAID" ? { paymentStatus: "REFUNDED" as const } : {};
}

/* ---------------- Saved doctors ---------------- */
export async function toggleSavedAction(doctorId: string) {
  const user = await requireRole(["PATIENT"]);
  const key = { patientId_doctorId: { patientId: user.id, doctorId } };
  const existing = await db.savedDoctor.findUnique({ where: key });
  if (existing) await db.savedDoctor.delete({ where: key });
  else await db.savedDoctor.create({ data: { patientId: user.id, doctorId } });
  revalidatePath("/patient/saved");
  return { saved: !existing };
}

/* ---------------- Family members (Create, Update, Delete) ---------------- */
function readFamily(fd: FormData) {
  return {
    name: fd.get("name"),
    relationship: fd.get("relationship"),
    dateOfBirth: fd.get("dateOfBirth"),
    gender: fd.get("gender"),
    accessibilityNeeds: (fd.get("accessibilityNeeds") as string) || undefined,
  };
}

export async function saveFamilyMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const parsed = familyMemberSchema.safeParse(readFamily(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const id = fd.get("id") as string | null;
  if (id) {
    // SECURITY: you can only edit your own family members.
    const owned = await db.familyMember.findFirst({ where: { id, patientId: user.id } });
    if (!owned) return { message: "You can only edit your own family members." };
    await db.familyMember.update({ where: { id }, data: parsed.data });
  } else {
    await db.familyMember.create({ data: { ...parsed.data, patientId: user.id } });
  }
  revalidatePath("/patient/family");
  return { ok: true, message: id ? "Family member updated." : "Family member added." };
}

export async function deleteFamilyMemberAction(id: string): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const member = await db.familyMember.findFirst({ where: { id, patientId: user.id } });
  if (!member) return { message: "You can only delete your own family members." };
  const upcoming = await db.appointment.count({
    where: { familyMemberId: id, status: { in: ["REQUESTED", "CONFIRMED"] }, date: { gte: nowInIndia().date } },
  });
  if (upcoming) return { message: `${member.name} has ${upcoming} upcoming appointment${upcoming > 1 ? "s" : ""}. Cancel ${upcoming > 1 ? "them" : "it"} first, then delete.` };
  await db.familyMember.delete({ where: { id } });
  revalidatePath("/patient/family");
  return { ok: true, message: `${member.name} was removed.` };
}

/* ---------------- Booking ---------------- */

/** Checks shared by booking and rescheduling. Returns an error message or null. */
async function slotProblem(doctorId: string, date: string, startMinute: number, ignoreAppointmentId?: string) {
  const { date: today } = nowInIndia();
  // DEMO TRAP 3: times in the past (or too far ahead) are refused by the server.
  if (minutesUntil(date, startMinute) <= 0) return "That time is in the past. Please choose a future slot.";
  if (date > addDays(today, BOOKING_WINDOW_DAYS - 1)) return "You can book up to 14 days ahead.";
  if (startMinute % 15 !== 0) return "Please choose one of the listed slots.";

  // DEMO TRAP 7: only verified, active doctors can receive bookings.
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorId }, include: { user: true } });
  if (!doctor || doctor.verificationStatus !== "VERIFIED" || doctor.user.status !== "ACTIVE")
    return "This doctor isn't taking bookings on TrustCare.";

  const inHours = await db.availabilityBlock.findFirst({
    where: { doctorId, dayOfWeek: dayOfWeek(date), startMinute: { lte: startMinute }, endMinute: { gte: startMinute + 15 } },
  });
  if (!inHours) return "The doctor doesn't work at that time.";
  const onLeave = await db.leave.findFirst({ where: { doctorId, fromDate: { lte: date }, toDate: { gte: date } } });
  if (onLeave) return "The doctor is on leave that day.";
  const taken = await db.appointment.findFirst({
    where: { doctorId, date, startMinute, status: { in: ["REQUESTED", "CONFIRMED"] }, NOT: ignoreAppointmentId ? { id: ignoreAppointmentId } : undefined },
  });
  if (taken) return "Sorry, this slot was just booked. Please choose another.";
  return null;
}

export async function bookAppointmentAction(_prev: FormState, fd: FormData): Promise<FormState & { appointmentId?: string; mode?: string; fee?: number }> {
  const user = await requireRole(["PATIENT"]);
  const parsed = bookingSchema.safeParse({
    doctorId: fd.get("doctorId"),
    mode: fd.get("mode") || "CLINIC",
    familyMemberId: (fd.get("familyMemberId") as string) || undefined,
    date: fd.get("date"),
    startMinute: fd.get("startMinute"),
    reasonForVisit: (fd.get("reasonForVisit") as string) || undefined,
    accessibilityNote: (fd.get("accessibilityNote") as string) || undefined,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const d = parsed.data;

  if (d.familyMemberId) {
    const fm = await db.familyMember.findFirst({ where: { id: d.familyMemberId, patientId: user.id } });
    if (!fm) return { message: "Please choose yourself or one of your own family members." };
  }
  const problem = await slotProblem(d.doctorId, d.date, d.startMinute);
  if (problem) return { message: problem };
  const doc = await db.doctorProfile.findUniqueOrThrow({ where: { id: d.doctorId } });
  if (d.mode === "VIDEO" && !doc.offersVideo) return { message: "This doctor doesn't offer video consultations." };
  const fee = d.mode === "VIDEO" ? (doc.videoFee ?? doc.fee) : doc.fee; // SECURITY: the price comes from the database, never the browser

  // Limit: each person (you, or each family member) can have at most 2 upcoming visits with the same doctor.
  const upcomingWithDoctor = await db.appointment.count({
    where: { patientId: user.id, familyMemberId: d.familyMemberId ?? null, doctorId: d.doctorId, status: { in: ["REQUESTED", "CONFIRMED"] }, date: { gte: nowInIndia().date } },
  });
  if (upcomingWithDoctor >= 2) return { message: "This person already has 2 upcoming appointments with this doctor." };

  try {
    // DEMO TRAP 2: a unique index in the database makes sure only one booking
    // per slot can succeed, even if two patients press "Confirm" at the same moment.
    const appt = await db.appointment.create({
      data: { patientId: user.id, doctorId: d.doctorId, familyMemberId: d.familyMemberId, date: d.date, startMinute: d.startMinute, reasonForVisit: d.reasonForVisit, accessibilityNote: d.accessibilityNote, mode: d.mode, fee },
      include: { doctor: { include: { user: true } }, familyMember: true },
    });
    await notify(appt.doctor.userId, "New booking request", `${user.name}${appt.familyMember ? ` (for ${appt.familyMember.name})` : ""} requested ${formatDateLong(d.date)}, ${formatMinute(d.startMinute)}.`, "/doctor/appointments");
    revalidatePath("/patient/appointments");
    return { ok: true, message: `Request sent. ${appt.doctor.user.name} usually confirms within a few hours. We'll notify you here.`, appointmentId: appt.id, mode: d.mode, fee };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { message: "Sorry, this slot was just booked. Please choose another." };
    throw e;
  }
}

/** Patient moves a Requested/Confirmed visit to a new slot; it goes back to Requested. */
export async function rescheduleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const id = fd.get("appointmentId") as string;
  const date = fd.get("date") as string;
  const startMinute = Number(fd.get("startMinute"));
  const appt = await db.appointment.findFirst({ where: { id, patientId: user.id }, include: { doctor: true } });
  if (!appt) return { message: "You can only manage your own appointments." };
  if (!["REQUESTED", "CONFIRMED"].includes(appt.status)) return { message: "Only upcoming appointments can be rescheduled." };
  if (!date || Number.isNaN(startMinute)) return { message: "Please choose a new date and time." };
  const problem = await slotProblem(appt.doctorId, date, startMinute, appt.id);
  if (problem) return { message: problem };
  try {
    await db.appointment.update({ where: { id }, data: { date, startMinute, status: "REQUESTED" } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { message: "Sorry, this slot was just booked. Please choose another." };
    throw e;
  }
  await notify(appt.doctor.userId, "Appointment rescheduled", `${user.name} moved a visit to ${formatDateLong(date)}, ${formatMinute(startMinute)}. Please confirm.`, "/doctor/appointments");
  revalidatePath("/patient/appointments");
  return { ok: true, message: `Moved to ${formatDateLong(date)}, ${formatMinute(startMinute)}. Waiting for the doctor to confirm.` };
}

export async function cancelByPatientAction(id: string, reason: string): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const appt = await db.appointment.findFirst({ where: { id, patientId: user.id }, include: { doctor: true } });
  if (!appt) return { message: "You can only manage your own appointments." };
  if (!["REQUESTED", "CONFIRMED"].includes(appt.status)) return { message: "This appointment can't be cancelled." };
  // DEMO TRAP 9: no cancelling in the last 2 hours.
  if (minutesUntil(appt.date, appt.startMinute) < 120)
    return { message: "Appointments can be cancelled up to 2 hours before. Please call the clinic." };
  await db.appointment.update({ where: { id }, data: { status: "CANCELLED", cancelledBy: "PATIENT", cancelReason: reason.trim().slice(0, 200) || "Cancelled by patient", ...refundIfPaid(appt.paymentStatus) } });
  await notify(appt.doctor.userId, "Appointment cancelled", `${user.name} cancelled the visit on ${formatDateLong(appt.date)}, ${formatMinute(appt.startMinute)}.`, "/doctor/appointments");
  revalidatePath("/patient/appointments");
  return { ok: true, message: "Appointment cancelled." };
}

/* ---------------- Reviews (Create, Update, Delete) + reports ---------------- */
function readReview(fd: FormData) {
  return { waitRating: fd.get("waitRating"), explanationRating: fd.get("explanationRating"), valueRating: fd.get("valueRating"), text: ((fd.get("text") as string) ?? "").trim() };
}

export async function createReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const appointmentId = fd.get("appointmentId") as string;
  const parsed = reviewSchema.safeParse(readReview(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  // DEMO TRAP 4: only the patient of a COMPLETED visit can review it, once, within 30 days.
  const appt = await db.appointment.findFirst({ where: { id: appointmentId, patientId: user.id }, include: { review: true } });
  if (!appt || appt.status !== "COMPLETED") return { message: "You can review a doctor only after a completed visit." };
  if (appt.review) return { message: "You have already reviewed this visit. You can edit it from My reviews." };
  if (appt.date < addDays(nowInIndia().date, -30)) return { message: "Reviews can be written up to 30 days after the visit." };

  await db.review.create({ data: { ...parsed.data, text: parsed.data.text || null, appointmentId, patientId: user.id, doctorId: appt.doctorId } });
  await recomputeRating(db, appt.doctorId);
  revalidatePath("/patient/reviews");
  return { ok: true, message: "Thank you! Your review is now live." };
}

export async function updateReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const id = fd.get("id") as string;
  const parsed = reviewSchema.safeParse(readReview(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const review = await db.review.findFirst({ where: { id, patientId: user.id } });
  if (!review) return { message: "You can only edit your own reviews." };
  await db.review.update({ where: { id }, data: { ...parsed.data, text: parsed.data.text || null } });
  await recomputeRating(db, review.doctorId);
  revalidatePath("/patient/reviews");
  return { ok: true, message: "Review updated." };
}

export async function deleteReviewAction(id: string): Promise<FormState> {
  const user = await requireRole(["PATIENT"]);
  const review = await db.review.findFirst({ where: { id, patientId: user.id } });
  if (!review) return { message: "You can only delete your own reviews." };
  await db.review.delete({ where: { id } });
  await recomputeRating(db, review.doctorId);
  revalidatePath("/patient/reviews");
  return { ok: true, message: "Review deleted." };
}

export async function reportReviewAction(reviewId: string, reason: string): Promise<FormState> {
  const user = await requireRole(["PATIENT", "DOCTOR"]);
  const allowed = ["Abusive", "Fake", "Personal information", "Other"];
  if (!allowed.includes(reason)) return { message: "Please choose a reason." };
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { message: "Review not found." };
  if (user.role === "DOCTOR" && review.doctorId !== user.doctorProfile?.id) return { message: "You can only report reviews of your own profile." };
  if (review.patientId === user.id) return { message: "You can't report your own review." };
  await db.reviewReport.create({ data: { reviewId, reportedById: user.id, reason } });
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  for (const a of admins) await notify(a.id, "Review reported", `A review was reported as "${reason}".`, "/admin/reviews");
  return { ok: true, message: "Thanks — our team will look at this review." };
}

/* ---------------- Notifications ---------------- */
export async function markNotificationsReadAction(id?: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({ where: { userId: user.id, ...(id ? { id } : {}) }, data: { isRead: true } });
  revalidatePath("/notifications");
}
