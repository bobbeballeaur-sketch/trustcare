// Admin: doctor verification queue and all doctors.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Portal, ADMIN_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { AllDoctors, VerificationQueue, type AdminDoctor } from "@/components/admin/doctors";

export const metadata = { title: "Doctor verification" };

export default async function AdminDoctors() {
  await requireRole(["ADMIN"], "/admin/doctors");
  const docs = await db.doctorProfile.findMany({ include: { user: true, specialisation: true, area: true }, orderBy: { createdAt: "desc" } });
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const rows: AdminDoctor[] = docs.map((d) => ({
    id: d.id, name: d.user.name, email: d.user.email, spec: d.specialisation.name, qualifications: d.qualifications,
    registrationNumber: d.registrationNumber, council: d.stateMedicalCouncil, year: d.registrationYear, status: d.verificationStatus,
    submitted: fmt(d.createdAt), area: d.area.name, clinic: d.clinicName, fee: d.fee, experience: d.experienceYears, languages: d.languages.join(", "),
    bio: d.bio, verifiedAt: d.verifiedAt ? fmt(d.verifiedAt) : null, verifiedBy: d.verifiedByName, rejectionReason: d.rejectionReason,
  }));
  const pending = rows.filter((r) => r.status === "PENDING");
  return (
    <Portal title="Admin" links={ADMIN_LINKS}>
      <PageTitle eyebrow="Admin" title="Doctor verification" sub="Doctors appear in search only after you check their registration on the NMC Indian Medical Register." />
      <h2 className="mb-3 text-xl font-medium">Waiting for verification ({pending.length})</h2>
      <VerificationQueue pending={pending} />
      <h2 className="mb-3 mt-10 text-xl font-medium">All doctors</h2>
      <AllDoctors doctors={rows} />
    </Portal>
  );
}
