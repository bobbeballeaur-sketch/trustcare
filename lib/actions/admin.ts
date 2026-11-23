"use server";
// Admin actions: verify doctors, manage users, moderate reviews, master data
// (specialisations) and resetting the demo data.
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, requireRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { recomputeRating, resetDemoData } from "@/lib/demo-data";
import { formatDateLong, formatMinute, nowInIndia } from "@/lib/time";
import { fieldErrors, reasonSchema, specialisationSchema, type FormState } from "@/lib/validation";

/* ---------------- Doctor verification ---------------- */
export async function approveDoctorAction(doctorId: string): Promise<FormState> {
  const admin = await requireRole(["ADMIN"]);
  const d = await db.doctorProfile.findUnique({ where: { id: doctorId } });
  if (!d || d.verificationStatus !== "PENDING") return { message: "Only pending doctors can be approved." };
  await db.doctorProfile.update({ where: { id: doctorId }, data: { verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedByName: admin.name, rejectionReason: null } });
  await notify(d.userId, "You're verified!", "Your registration was checked on the NMC register. Your profile now appears in search.", "/doctor");
  revalidatePath("/admin/doctors");
  return { ok: true, message: "Doctor approved — now visible in search with the Verified badge." };
}

export async function rejectDoctorAction(doctorId: string, reason: string): Promise<FormState> {
  await requireRole(["ADMIN"]);
  const r = reasonSchema.safeParse(reason);
  if (!r.success) return { message: r.error.issues[0].message };
  const d = await db.doctorProfile.findUnique({ where: { id: doctorId } });
  if (!d || d.verificationStatus !== "PENDING") return { message: "Only pending doctors can be rejected." };
  await db.doctorProfile.update({ where: { id: doctorId }, data: { verificationStatus: "REJECTED", rejectionReason: r.data } });
  await notify(d.userId, "Registration not approved", `Reason: ${r.data}`, "/doctor");
  revalidatePath("/admin/doctors");
  return { ok: true, message: "Doctor rejected. They can see the reason and resubmit." };
}

/** Revoking hides the doctor and cancels their future appointments. */
export async function revokeDoctorAction(doctorId: string, reason: string): Promise<FormState> {
  await requireRole(["ADMIN"]);
  const r = reasonSchema.safeParse(reason);
  if (!r.success) return { message: r.error.issues[0].message };
  const d = await db.doctorProfile.findUnique({ where: { id: doctorId }, include: { user: true } });
  if (!d || d.verificationStatus !== "VERIFIED") return { message: "Only verified doctors can be revoked." };
  await db.doctorProfile.update({ where: { id: doctorId }, data: { verificationStatus: "REVOKED", rejectionReason: r.data } });
  const future = await db.appointment.findMany({ where: { doctorId, date: { gte: nowInIndia().date }, status: { in: ["REQUESTED", "CONFIRMED"] } } });
  for (const a of future) {
    await db.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED", cancelledBy: "SYSTEM", cancelReason: "Doctor no longer verified", ...(a.paymentStatus === "PAID" ? { paymentStatus: "REFUNDED" as const } : {}) } });
    await notify(a.patientId, "Appointment cancelled", `Your visit with ${d.user.name} on ${formatDateLong(a.date)}, ${formatMinute(a.startMinute)} was cancelled. Please book another doctor.`, "/doctors");
  }
  await notify(d.userId, "Verification revoked", `Reason: ${r.data}`, "/doctor");
  revalidatePath("/admin/doctors");
  return { ok: true, message: `Verification revoked. ${future.length} future appointment(s) cancelled and patients notified.` };
}

/* ---------------- Users ---------------- */
export async function setUserStatusAction(userId: string, suspend: boolean, reason: string): Promise<FormState> {
  const admin = await requireRole(["ADMIN"]);
  if (userId === admin.id) return { message: "You can't suspend your own account." };
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { message: "User not found." };
  if (target.role === "ADMIN") return { message: "Admin accounts can't be suspended here." };
  const r = reasonSchema.safeParse(reason);
  if (!r.success) return { message: r.error.issues[0].message };
  await db.user.update({ where: { id: userId }, data: { status: suspend ? "SUSPENDED" : "ACTIVE", suspendedReason: suspend ? r.data : null } });
  revalidatePath("/admin/users");
  return { ok: true, message: suspend ? `${target.name} is suspended and can no longer log in.` : `${target.name} is active again.` };
}

/* ---------------- Review moderation ---------------- */
export async function moderateReviewAction(reviewId: string, decision: "keep" | "hide", reason = ""): Promise<FormState> {
  await requireRole(["ADMIN"]);
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { message: "Review not found." };
  if (decision === "keep") {
    await db.reviewReport.updateMany({ where: { reviewId, status: "OPEN" }, data: { status: "KEPT" } });
  } else {
    const r = reasonSchema.safeParse(reason);
    if (!r.success) return { message: r.error.issues[0].message };
    await db.review.update({ where: { id: reviewId }, data: { isHidden: true, hiddenReason: r.data } });
    await db.reviewReport.updateMany({ where: { reviewId, status: "OPEN" }, data: { status: "HIDDEN" } });
    await recomputeRating(db, review.doctorId); // hidden reviews stop counting
  }
  revalidatePath("/admin/reviews");
  return { ok: true, message: decision === "keep" ? "Report dismissed — the review stays." : "Review hidden. It no longer counts towards the rating." };
}

/* ---------------- Master data: specialisations (full CRUD) ---------------- */
export async function saveSpecialisationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireRole(["ADMIN"]);
  const parsed = specialisationSchema.safeParse({ name: fd.get("name"), simpleName: fd.get("simpleName"), hindiName: fd.get("hindiName") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const id = fd.get("id") as string | null;
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const clash = await db.specialisation.findFirst({ where: { OR: [{ name: { equals: parsed.data.name, mode: "insensitive" } }, { slug }], NOT: id ? { id } : undefined } });
  if (clash) return { errors: { name: "A specialisation with this name already exists." } };
  if (id) await db.specialisation.update({ where: { id }, data: { ...parsed.data, slug } });
  else await db.specialisation.create({ data: { ...parsed.data, slug } });
  revalidatePath("/admin/specialisations");
  return { ok: true, message: id ? "Specialisation updated." : "Specialisation added." };
}

export async function deleteSpecialisationAction(id: string): Promise<FormState> {
  await requireRole(["ADMIN"]);
  const s = await db.specialisation.findUnique({ where: { id }, include: { _count: { select: { doctors: true } } } });
  if (!s) return { message: "Not found." };
  // DEMO TRAP 8: can't delete a specialisation that doctors still use.
  if (s._count.doctors > 0) return { message: `This specialisation is used by ${s._count.doctors} doctor${s._count.doctors > 1 ? "s" : ""} and can't be deleted.` };
  await db.$transaction([
    db.symptomRule.updateMany({ where: { specialisationId: id }, data: { specialisationId: null } }),
    db.searchEvent.updateMany({ where: { specialisationId: id }, data: { specialisationId: null } }),
    db.specialisation.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/specialisations");
  return { ok: true, message: `${s.name} deleted.` };
}

/* ---------------- Demo tools ---------------- */
export async function resetDemoAction(): Promise<FormState> {
  const admin = await requireRole(["ADMIN"]);
  const r = await resetDemoData(db);
  // Accounts were re-created with new IDs, so log this admin in again.
  const again = await db.user.findUnique({ where: { email: admin.email } }) ?? await db.user.findUnique({ where: { email: "admin@demo.com" } });
  if (again) await createSession(again.id, again.role);
  revalidatePath("/", "layout");
  return { ok: true, message: `Demo data reset: ${r.doctors} doctors, ${r.patients} patients, appointments and reviews re-created.` };
}
