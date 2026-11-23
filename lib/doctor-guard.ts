// Page guard for the doctor portal.
import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "./auth";

/**
 * Doctors without a profile go to registration step 2.
 * Pending / rejected / revoked doctors only see their status screen (/doctor).
 */
export async function requireVerifiedDoctor(path: string) {
  const user = await requireRole(["DOCTOR"], path);
  if (!user.doctorProfile) redirect("/doctor/register");
  if (user.doctorProfile.verificationStatus !== "VERIFIED") redirect("/doctor");
  return { user, doctorId: user.doctorProfile.id };
}
