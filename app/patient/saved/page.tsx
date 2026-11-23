// Saved doctors with quick Book buttons.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { nextSlots } from "@/lib/doctors";
import { Shell, PageTitle, EmptyState } from "@/components/shell";
import { DoctorCard } from "@/components/doctors/doctor-card";

export const metadata = { title: "Saved doctors" };

export default async function SavedPage() {
  const user = await requireRole(["PATIENT"], "/patient/saved");
  const lang = await getLang();
  const saved = await db.savedDoctor.findMany({
    where: { patientId: user.id, doctor: { verificationStatus: "VERIFIED" } },
    orderBy: { createdAt: "desc" },
    include: { doctor: { include: { user: { select: { name: true } }, specialisation: true, area: true } } },
  });
  const slots = await nextSlots(saved.map((s) => s.doctorId));
  return (
    <Shell>
      <PageTitle eyebrow="Patient" title="Saved doctors" sub="Doctors you've saved for later." />
      {saved.length === 0 ? (
        <EmptyState title="No saved doctors yet" text="Tap the heart on any doctor to save them here." href="/doctors" cta="Find a doctor" />
      ) : (
        <ul className="flex flex-col gap-3">
          {saved.map((s) => (
            <li key={s.doctorId}><DoctorCard d={{ ...s.doctor, nextSlot: slots.get(s.doctorId) ?? null, distanceKm: null }} lang={lang} saved canSave /></li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
