// Map of Indore: every verified doctor and hospital as a clickable pin.
import { db } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { Shell, PageTitle } from "@/components/shell";
import { IndoreMap } from "@/components/map/indore-map";

export const metadata = { title: "Map of doctors in Indore" };

export default async function MapPage() {
  const lang = await getLang();
  const [doctors, hospitals, areas, specs] = await Promise.all([
    db.doctorProfile.findMany({ where: { verificationStatus: "VERIFIED", user: { status: "ACTIVE" } }, include: { user: { select: { name: true } }, specialisation: true, area: true } }),
    db.hospital.findMany({ include: { area: true } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
    db.specialisation.findMany({ orderBy: { simpleName: "asc" } }),
  ]);
  return (
    <Shell wide>
      <PageTitle eyebrow={pick(lang, "Explore", "खोजें")} title={pick(lang, "Doctors near you, on the map", "आपके पास के डॉक्टर, नक्शे पर")} sub={pick(lang, "Tap a pin to see the doctor, their fee and rating, and book. Orange dots mean the doctor also offers video consultations from home.", "पिन दबाकर डॉक्टर, फ़ीस और रेटिंग देखें और बुक करें। नारंगी बिंदु का मतलब वीडियो परामर्श भी उपलब्ध।")} />
      <IndoreMap
        doctors={doctors.map((d) => ({ id: d.id, name: d.user.name, spec: `${d.specialisation.simpleName} (${d.specialisation.name})`, specSlug: d.specialisation.slug, area: d.area.name, fee: d.fee, rating: d.ratingAverage, reviews: d.ratingCount, lat: d.latitude, lng: d.longitude, video: d.offersVideo, videoFee: d.videoFee, clinic: d.clinicName }))}
        hospitals={hospitals.map((h) => ({ id: h.id, name: h.name, area: h.area.name, lat: h.latitude, lng: h.longitude, beds: h.bedsAvailable, icu: h.icuAvailable, open24x7: h.open24x7, phone: h.phone }))}
        areas={areas.map((a) => ({ name: a.name, lat: a.latitude, lng: a.longitude }))}
        specs={specs.map((s) => ({ slug: s.slug, label: `${s.simpleName} (${s.name})` }))}
      />
    </Shell>
  );
}
