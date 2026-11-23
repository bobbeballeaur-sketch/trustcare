// Home page. Data comes from the database; the animated sections are client components.
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VoiceAssistant } from "@/components/voice-assistant";
import { SmoothScroll } from "@/components/home/smooth-scroll";
import { Hero } from "@/components/home/hero";
import { TrustStrip, VerifiedPanel, SpecialityChips, Journey } from "@/components/home/sections-a";
import { HowItWorks, SymptomWheel, Bento } from "@/components/home/sections-b";
import { DoctorsGrid, Testimonials, FinalCta, Services } from "@/components/home/sections-c";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const verified = { verificationStatus: "VERIFIED" as const, user: { status: "ACTIVE" as const } };
  const [areas, specs, doctorCount, doctors, rules, reviews] = await Promise.all([
    db.area.findMany({ orderBy: { name: "asc" }, select: { name: true, hindiName: true } }),
    db.specialisation.findMany({ orderBy: { name: "asc" } }),
    db.doctorProfile.count({ where: verified }),
    db.doctorProfile.findMany({
      where: verified,
      orderBy: { ratingAverage: "desc" },
      take: 12,
      include: { user: { select: { name: true } }, specialisation: true, area: true },
    }),
    db.symptomRule.findMany({ select: { symptom: true, symptomHindi: true, isEmergency: true } }),
    db.review.findMany({
      where: { isHidden: false, text: { not: null }, reports: { none: {} }, waitRating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { patient: { select: { name: true } }, doctor: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return (
    <>
      <SmoothScroll />
      <SiteHeader overlay />
      <main id="main">
        <Hero areas={areas} />
        <Services />
        <TrustStrip doctors={doctorCount} areas={areas.length} specs={specs.length} />
        <VerifiedPanel />
        <SpecialityChips specs={specs.map((s) => ({ slug: s.slug, name: s.name, simpleName: s.simpleName, hindiName: s.hindiName }))} />
        <Journey />
        <HowItWorks />
        <SymptomWheel symptoms={rules.map((r) => ({ en: r.symptom, hi: r.symptomHindi, emergency: r.isEmergency }))} />
        <Bento />
        <DoctorsGrid
          doctors={doctors.map((d) => ({ id: d.id, name: d.user.name, photoUrl: d.photoUrl, spec: d.specialisation.simpleName, specHi: d.specialisation.hindiName, area: d.area.name }))}
        />
        <Testimonials
          stories={reviews.map((r) => ({
            name: r.patient.name.split(" ")[0] + " " + (r.patient.name.split(" ")[1]?.[0] ?? "") + ".",
            text: r.text ?? "",
            rating: Math.round((r.waitRating + r.explanationRating + r.valueRating) / 3),
            doctor: r.doctor.user.name,
          }))}
        />
        <FinalCta />
      </main>
      <SiteFooter />
      <VoiceAssistant />
    </>
  );
}
