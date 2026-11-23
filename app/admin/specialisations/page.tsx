// Admin: master data — specialisations (full CRUD), areas and hospitals.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Portal, ADMIN_LINKS } from "@/components/portal";
import { PageTitle } from "@/components/shell";
import { SpecialisationsManager } from "@/components/admin/specialisations";

export const metadata = { title: "Master data" };

export default async function AdminMasterData() {
  await requireRole(["ADMIN"], "/admin/specialisations");
  const [specs, areas, hospitals] = await Promise.all([
    db.specialisation.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { doctors: true } } } }),
    db.area.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { doctors: true } } } }),
    db.hospital.findMany({ orderBy: { name: "asc" }, include: { area: true } }),
  ]);
  return (
    <Portal title="Admin" links={ADMIN_LINKS}>
      <PageTitle eyebrow="Admin" title="Master data" sub="Specialisations power search, the guide and the home page." />
      <h2 className="mb-3 text-xl font-medium">Specialisations</h2>
      <SpecialisationsManager rows={specs.map((s) => ({ id: s.id, name: s.name, simpleName: s.simpleName, hindiName: s.hindiName, doctors: s._count.doctors }))} />
      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="areas-h" className="rounded-3xl border border-line bg-white p-5">
          <h2 id="areas-h" className="mb-3 text-lg font-medium">Areas of Indore</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-ink-2"><tr><th scope="col" className="py-2 font-medium">Area</th><th scope="col" className="py-2 font-medium">PIN</th><th scope="col" className="py-2 font-medium">Doctors</th></tr></thead>
            <tbody className="divide-y divide-line">{areas.map((a) => <tr key={a.id}><td className="py-2">{a.name} <span lang="hi" className="text-ink-2">{a.hindiName}</span></td><td>{a.pinCode}</td><td>{a._count.doctors}</td></tr>)}</tbody>
          </table>
        </section>
        <section aria-labelledby="hosp-h" className="rounded-3xl border border-line bg-white p-5">
          <h2 id="hosp-h" className="mb-3 text-lg font-medium">Hospitals (demo)</h2>
          <ul className="divide-y divide-line text-sm">
            {hospitals.map((h) => <li key={h.id} className="py-2"><b className="font-medium">{h.name}</b> · {h.area.name}<br /><span className="text-ink-2">{[h.open24x7 && "24×7", h.emergencyWard && "Emergency ward", h.acceptsAyushman && "Ayushman", h.bloodBank && "Blood bank"].filter(Boolean).join(" · ") || "Day clinic"}</span></li>)}
          </ul>
        </section>
      </div>
    </Portal>
  );
}
