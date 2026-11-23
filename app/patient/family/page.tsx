// Family members page (full CRUD).
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Shell, PageTitle } from "@/components/shell";
import { FamilyManager } from "@/components/patient/family";

export const metadata = { title: "Family members" };

export default async function FamilyPage() {
  const user = await requireRole(["PATIENT"], "/patient/family");
  const members = await db.familyMember.findMany({ where: { patientId: user.id }, orderBy: { createdAt: "asc" } });
  return (
    <Shell>
      <PageTitle eyebrow="Patient" title="Family members" sub="Book appointments for the people you care for. Their accessibility needs are shared with the clinic when you book." />
      <FamilyManager members={members.map(({ id, name, relationship, dateOfBirth, gender, accessibilityNeeds }) => ({ id, name, relationship, dateOfBirth, gender, accessibilityNeeds }))} />
    </Shell>
  );
}
