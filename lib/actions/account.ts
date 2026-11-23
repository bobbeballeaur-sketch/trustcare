"use server";
// Any logged-in user: edit name, phone and language; change password.
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { accountSchema, fieldErrors, passwordChangeSchema, type FormState } from "@/lib/validation";

export async function updateAccountAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL"]);
  const parsed = accountSchema.safeParse({ name: fd.get("name"), phone: fd.get("phone"), preferredLanguage: fd.get("preferredLanguage") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  // Apply the preferred language to the site straight away.
  (await cookies()).set("lang", parsed.data.preferredLanguage, { path: "/", maxAge: 31536000, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL"]);
  const parsed = passwordChangeSchema.safeParse({ currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword"), confirmPassword: fd.get("confirmPassword") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)))
    return { errors: { currentPassword: "Your current password is not correct." }, message: "Your current password is not correct." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
  return { ok: true, message: "Password changed." };
}
