"use server";
// Server actions for sign up, log in and log out.
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, homeFor } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { fieldErrors, loginSchema, signupSchema, type FormState } from "@/lib/validation";

/** Only allow redirects to our own pages (never to another website). */
function safeNext(next: FormDataEntryValue | null): string | null {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // SECURITY: order of checks — (1) CAPTCHA, (2) account not suspended, (3) password.
  // DEMO TRAP 6: logging in without completing the CAPTCHA is refused here.
  const captchaOk = await verifyTurnstile(formData.get("cf-turnstile-response") as string | null);
  if (!captchaOk) return { message: "Please complete the CAPTCHA check.", errors: { captcha: "Please complete the CAPTCHA check." } };

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  // SECURITY: lock an email for 10 minutes after 5 wrong passwords in 15 minutes.
  const email = parsed.data.email;
  const lastSuccess = await db.loginAttempt.findFirst({ where: { email, success: true }, orderBy: { createdAt: "desc" } });
  const recentFails = await db.loginAttempt.findMany({
    where: { email, success: false, createdAt: { gte: new Date(Math.max(Date.now() - 15 * 60000, lastSuccess?.createdAt.getTime() ?? 0)) } },
    orderBy: { createdAt: "desc" },
  });
  if (recentFails.length >= 5 && Date.now() - recentFails[0].createdAt.getTime() < 10 * 60000)
    return { message: "Too many wrong passwords. For your safety this account is locked for 10 minutes." };

  const user = await db.user.findUnique({ where: { email } });
  if (user?.status === "SUSPENDED") {
    return { message: "This account has been suspended. Please contact the TrustCare team." };
  }
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  // SECURITY: the same message for a wrong email or a wrong password,
  // so nobody can find out which emails have accounts.
  await db.loginAttempt.create({ data: { email, success: !!user && passwordOk } });
  if (!user || !passwordOk) return { message: "Invalid email or password." };

  await createSession(user.id, user.role);
  redirect(safeNext(formData.get("next")) ?? homeFor(user.role));
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const captchaOk = await verifyTurnstile(formData.get("cf-turnstile-response") as string | null);
  if (!captchaOk) return { message: "Please complete the CAPTCHA check.", errors: { captcha: "Please complete the CAPTCHA check." } };

  const asDoctor = formData.get("role") === "DOCTOR";
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    preferredLanguage: formData.get("preferredLanguage") || "en",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  // DEMO TRAP 1: an email can only be used once.
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { errors: { email: "An account with this email already exists." }, message: "An account with this email already exists." };

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      preferredLanguage: parsed.data.preferredLanguage,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: asDoctor ? "DOCTOR" : "PATIENT", // SECURITY: admins can never be created through sign-up
    },
  });
  await createSession(user.id, user.role);
  redirect(asDoctor ? "/doctor/register" : "/doctors");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
