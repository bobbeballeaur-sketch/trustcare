// Doctor search: turns the filters in the page URL into a database query,
// then sorts and pages the results.
import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { generateSlots, nowInIndia } from "./time";
import { interpretVoice } from "./voice";

export type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const PAGE_SIZE = 10;
export const ACCESS_KEYS = ["ramp", "lift", "accessibleWashroom", "groundFloor", "signLanguage", "textBooking", "homeVisits"] as const;

/** Next free slot for each doctor (used on cards and for "soonest" sorting). */
export async function nextSlots(doctorIds: string[]) {
  const { date: today } = nowInIndia();
  const [blocks, leaves, taken] = await Promise.all([
    db.availabilityBlock.findMany({ where: { doctorId: { in: doctorIds } } }),
    db.leave.findMany({ where: { doctorId: { in: doctorIds }, toDate: { gte: today } } }),
    db.appointment.findMany({ where: { doctorId: { in: doctorIds }, date: { gte: today }, status: { in: ["REQUESTED", "CONFIRMED"] } }, select: { doctorId: true, date: true, startMinute: true } }),
  ]);
  const result = new Map<string, { date: string; minute: number } | null>();
  for (const id of doctorIds) {
    const days = generateSlots(blocks.filter((b) => b.doctorId === id), leaves.filter((l) => l.doctorId === id), taken.filter((t) => t.doctorId === id));
    let found: { date: string; minute: number } | null = null;
    for (const d of days) {
      const s = d.slots.find((x) => x.free);
      if (s) { found = { date: d.date, minute: s.minute }; break; }
    }
    result.set(id, found);
  }
  return result;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude), dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function searchDoctors(sp: SearchParams) {
  let q = one(sp.q).trim().slice(0, 80);
  let spec = one(sp.spec);
  let area = one(sp.area);

  // A spoken or typed sentence like "skin doctor in Vijay Nagar" becomes filters.
  if (q && !spec && !area) {
    const v = interpretVoice(q);
    if (v?.kind === "nav" && v.href.startsWith("/doctors?")) {
      const p = new URLSearchParams(v.href.split("?")[1]);
      if (p.get("spec")) { spec = p.get("spec")!; }
      if (p.get("area")) { area = p.get("area")!; }
      if (spec || area) q = "";
    }
  }

  // SECURITY: only verified doctors whose account is active ever appear.
  const where: Prisma.DoctorProfileWhereInput = { verificationStatus: "VERIFIED", user: { status: "ACTIVE" } };
  const and: Prisma.DoctorProfileWhereInput[] = [];

  if (q) {
    // Symptom words map to a specialisation using the guide rules.
    const rules = await db.symptomRule.findMany({
      where: { OR: [{ symptom: { contains: q, mode: "insensitive" } }, { symptomHindi: { contains: q } }], specialisationId: { not: null } },
      select: { specialisationId: true },
    });
    and.push({
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { clinicName: { contains: q, mode: "insensitive" } },
        { specialisation: { name: { contains: q, mode: "insensitive" } } },
        { specialisation: { simpleName: { contains: q, mode: "insensitive" } } },
        { specialisation: { hindiName: { contains: q } } },
        { specialisationId: { in: rules.map((r) => r.specialisationId!) } },
      ],
    });
  }
  if (spec) and.push({ specialisation: { slug: spec } });
  if (area) and.push({ area: { name: area } });
  const minFee = Number(one(sp.minFee)) || 0;
  const maxFee = Number(one(sp.maxFee)) || 0;
  if (minFee) and.push({ fee: { gte: minFee } });
  if (maxFee) and.push({ fee: { lte: maxFee } });
  const langs = list(sp.lang);
  if (langs.length) and.push({ languages: { hasSome: langs } });
  const gender = one(sp.gender);
  if (gender === "Female" || gender === "Male") and.push({ gender });
  const rating = Number(one(sp.rating)) || 0;
  if (rating) and.push({ ratingAverage: { gte: rating } });
  const exp = Number(one(sp.exp)) || 0;
  if (exp) and.push({ experienceYears: { gte: exp } });
  if (one(sp.ayushman) === "1") and.push({ acceptsAyushman: true });
  if (one(sp.video) === "1") and.push({ offersVideo: true });
  for (const k of list(sp.access)) if ((ACCESS_KEYS as readonly string[]).includes(k)) and.push({ [k]: true });
  if (one(sp.evening) === "1") and.push({ availability: { some: { endMinute: { gt: 18 * 60 } } } });
  if (one(sp.sunday) === "1") and.push({ availability: { some: { dayOfWeek: 0 } } });
  if (and.length) where.AND = and;

  let doctors = await db.doctorProfile.findMany({
    where,
    include: { user: { select: { name: true } }, specialisation: true, area: true },
  });

  const slots = await nextSlots(doctors.map((d) => d.id));
  const when = one(sp.when);
  if (when === "today" || when === "week") {
    const { date: today } = nowInIndia();
    const limit = when === "today" ? today : new Date(Date.parse(today) + 6 * 86400000).toISOString().slice(0, 10);
    doctors = doctors.filter((d) => { const s = slots.get(d.id); return s && s.date <= limit; });
  }

  const areaRow = area ? await db.area.findUnique({ where: { name: area } }) : null;
  const dist = (d: (typeof doctors)[number]) => (areaRow ? distanceKm(areaRow, d.area) : 0);

  const sort = one(sp.sort) || "best";
  const slotKey = (id: string) => { const s = slots.get(id); return s ? s.date + String(s.minute).padStart(4, "0") : "9999"; };
  doctors.sort((a, b) => {
    switch (sort) {
      case "rating": return b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount;
      case "feeLow": return a.fee - b.fee;
      case "feeHigh": return b.fee - a.fee;
      case "experience": return b.experienceYears - a.experienceYears;
      case "soonest": return slotKey(a.id).localeCompare(slotKey(b.id));
      case "nearest": return dist(a) - dist(b);
      default: // best match: rating weighted by number of reviews
        return b.ratingAverage * Math.log2(b.ratingCount + 2) - a.ratingAverage * Math.log2(a.ratingCount + 2);
    }
  });

  // Log the search (no personal data) for the admin's "most searched" chart.
  const page = Math.max(1, Number(one(sp.page)) || 1);
  if (page === 1 && (spec || area)) {
    const specRow = spec ? await db.specialisation.findUnique({ where: { slug: spec } }) : null;
    await db.searchEvent.create({ data: { specialisationId: specRow?.id, areaId: areaRow?.id } });
  }

  const total = doctors.length;
  const pageItems = doctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((d) => ({
    ...d,
    nextSlot: slots.get(d.id) ?? null,
    distanceKm: areaRow ? Math.round(dist(d) * 10) / 10 : null,
  }));
  return { doctors: pageItems, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), resolved: { q, spec, area, sort } };
}
