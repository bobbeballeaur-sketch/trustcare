// Login sessions. After a successful login we store a signed token in an
// httpOnly cookie. The browser cannot read or change it.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "./db";

const COOKIE = "tc_session";
// The signing key comes from AUTH_SECRET. If that isn't set, it is derived from
// the (secret) database address, so a fresh Vercel deploy works without extra setup.
import { createHash } from "node:crypto";
const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || createHash("sha256").update(`trustcare:${process.env.DATABASE_URL ?? "dev"}`).digest("hex"),
  );

export async function createSession(userId: string, role: Role) {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in user, or null. Suspended users count as logged out. */
export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { doctorProfile: { select: { id: true, verificationStatus: true, rejectionReason: true } } },
    });
    if (!user || user.status === "SUSPENDED") return null;
    return user;
  } catch {
    return null;
  }
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * SECURITY: use at the top of every protected page and server action.
 * Not logged in -> login page (and back afterwards). Wrong role -> 403 page.
 */
export async function requireRole(roles: Role[], returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  if (!roles.includes(user.role)) redirect("/403");
  return user;
}

/** Where each role lands after logging in. */
export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin" : role === "DOCTOR" ? "/doctor" : role === "HOSPITAL" ? "/hospital" : "/doctors";
}
