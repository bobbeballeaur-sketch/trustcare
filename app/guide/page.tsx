// "Which doctor do I need?" guide page.
import { db } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { Shell, PageTitle } from "@/components/shell";
import { Guide } from "@/components/guide/guide";

export const metadata = { title: "Which doctor do I need?" };

export default async function GuidePage() {
  const lang = await getLang();
  const [rules, specs, hospitals, doctors] = await Promise.all([
    db.symptomRule.findMany({ include: { specialisation: { select: { slug: true } } }, orderBy: { symptom: "asc" } }),
    db.specialisation.findMany(),
    db.hospital.findMany({ where: { open24x7: true, emergencyWard: true }, include: { area: true } }),
    db.doctorProfile.findMany({ where: { verificationStatus: "VERIFIED", user: { status: "ACTIVE" } }, orderBy: { ratingAverage: "desc" }, include: { user: { select: { name: true } }, specialisation: { select: { slug: true } }, area: true } }),
  ]);
  const bySpec: Record<string, { id: string; name: string; area: string; fee: number; rating: number }[]> = {};
  for (const d of doctors) {
    const list = (bySpec[d.specialisation.slug] ??= []);
    if (list.length < 3) list.push({ id: d.id, name: d.user.name, area: d.area.name, fee: d.fee, rating: d.ratingAverage });
  }
  return (
    <Shell>
      <PageTitle eyebrow={pick(lang, "Symptom guide", "लक्षण गाइड")} title={pick(lang, "Which doctor do I need?", "मुझे कौन सा डॉक्टर चाहिए?")} sub={pick(lang, "Three quick steps. We'll suggest the right type of doctor — and tell you straight away if it might be an emergency.", "तीन आसान कदम। हम सही डॉक्टर का प्रकार बताएंगे — और आपातकाल हो तो तुरंत बताएंगे।")} />
      <Guide
        rules={rules.map((r) => ({ id: r.id, bodyArea: r.bodyArea, symptom: r.symptom, symptomHindi: r.symptomHindi, appliesTo: r.appliesTo, specSlug: r.specialisation?.slug ?? null, isEmergency: r.isEmergency, isSelfHarm: r.isSelfHarm }))}
        specs={specs.map((s) => ({ slug: s.slug, name: s.name, simpleName: s.simpleName, hindiName: s.hindiName }))}
        hospitals={hospitals.map((h) => ({ id: h.id, name: h.name, address: h.address, area: h.area.name, phone: h.phone, ayushman: h.acceptsAyushman }))}
        doctorsBySpec={bySpec}
      />
    </Shell>
  );
}
