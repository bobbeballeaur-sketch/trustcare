// Doctor sign-up step 2 (and resubmission after a rejection).
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { submitRegistrationAction } from "@/lib/actions/doctor";
import { Shell, PageTitle } from "@/components/shell";
import { ProfileForm } from "@/components/doctor/profile-form";

export const metadata = { title: "Doctor registration" };

export default async function RegisterPage() {
  const user = await requireRole(["DOCTOR"], "/doctor/register");
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (profile?.verificationStatus === "VERIFIED") redirect("/doctor/profile");
  const [specs, areas] = await Promise.all([db.specialisation.findMany({ orderBy: { simpleName: "asc" } }), db.area.findMany({ orderBy: { name: "asc" } })]);
  return (
    <Shell>
      <PageTitle eyebrow="Step 2 of 2" title={profile ? "Edit and resubmit your registration" : "Your professional details"} sub="Our team checks your registration number on the NMC Indian Medical Register before you appear in search." />
      {profile?.rejectionReason && <p className="mb-6 rounded-2xl bg-danger-soft p-4 text-danger"><b>Why it was not approved:</b> {profile.rejectionReason}</p>}
      <ProfileForm
        mode="register"
        action={submitRegistrationAction}
        specs={specs.map((s) => ({ id: s.id, label: `${s.simpleName} (${s.name})` }))}
        areas={areas.map((a) => ({ id: a.id, label: a.name }))}
        initial={profile ?? {}}
      />
    </Shell>
  );
}
