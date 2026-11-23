// Doctor: edit profile and clinic.
import { db } from "@/lib/db";
import { requireVerifiedDoctor } from "@/lib/doctor-guard";
import { updateProfileAction } from "@/lib/actions/doctor";
import { Portal, DOCTOR_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { ProfileForm } from "@/components/doctor/profile-form";

export const metadata = { title: "My profile" };

export default async function DoctorProfilePage() {
  const { doctorId } = await requireVerifiedDoctor("/doctor/profile");
  const [profile, specs, areas] = await Promise.all([
    db.doctorProfile.findUniqueOrThrow({ where: { id: doctorId } }),
    db.specialisation.findMany({ orderBy: { simpleName: "asc" } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <Portal title="Doctor portal" links={DOCTOR_LINKS}>
      <PageTitle eyebrow="Doctor portal" title="My profile" sub="This is what patients see on your public profile." />
      <ProfileForm mode="edit" action={updateProfileAction} specs={specs.map((s) => ({ id: s.id, label: `${s.simpleName} (${s.name})` }))} areas={areas.map((a) => ({ id: a.id, label: a.name }))} initial={profile} />
    </Portal>
  );
}
