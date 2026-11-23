// Hospital portal: keep beds, ICU, oxygen and blood stock up to date.
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Shell, PageTitle } from "@/components/shell";
import { Stat } from "@/components/doctor/stat";
import { HospitalForm } from "@/components/hospital-form";

export const metadata = { title: "Hospital dashboard" };

export default async function HospitalPortal() {
  const user = await requireRole(["HOSPITAL"], "/hospital");
  const h = await db.hospital.findUnique({ where: { userId: user.id }, include: { area: true } });
  if (!h) return <Shell><PageTitle title="No hospital linked" sub="Ask the TrustCare admin to link your hospital to this account." /></Shell>;
  const nearbyDoctors = await db.doctorProfile.count({ where: { areaId: h.areaId, verificationStatus: "VERIFIED" } });
  return (
    <Shell>
      <PageTitle eyebrow="Hospital portal" title={h.name} sub={`${h.address}, ${h.area.name} · last updated ${h.updatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`}>
        <Link href={`/hospitals#h-${h.id}`} className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">See public listing</Link>
      </PageTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Free beds" value={h.bedsAvailable} />
        <Stat label="Free ICU beds" value={h.icuAvailable} />
        <Stat label="Blood groups in stock" value={h.bloodGroups.length} />
        <Stat label="Verified doctors nearby" value={nearbyDoctors} note={h.area.name} />
      </div>
      <section aria-labelledby="upd-h" className="rounded-3xl border border-line bg-white p-6">
        <h2 id="upd-h" className="mb-1 text-lg font-medium">Live availability</h2>
        <p className="mb-5 text-sm text-ink-2">Shown to patients on the Emergency page, the Hospitals page and the map.</p>
        <HospitalForm h={{ phone: h.phone, bedsAvailable: h.bedsAvailable, icuAvailable: h.icuAvailable, oxygenAvailable: h.oxygenAvailable, open24x7: h.open24x7, emergencyWard: h.emergencyWard, acceptsAyushman: h.acceptsAyushman, bloodGroups: h.bloodGroups, specialities: h.specialities }} />
      </section>
    </Shell>
  );
}
