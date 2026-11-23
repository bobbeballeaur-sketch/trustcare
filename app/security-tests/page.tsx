// Security tests page: send tampered requests and watch the server refuse them.
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, nowInIndia } from "@/lib/time";
import { Shell, PageTitle } from "@/components/shell";
import { Portal, ADMIN_LINKS, DOCTOR_LINKS } from "@/components/portal";
import { SecurityTests, type SecurityContext } from "@/components/security-tests";

export const metadata = { title: "Security tests" };

export default async function SecurityTestsPage() {
  const user = await requireRole(["PATIENT", "DOCTOR", "ADMIN"], "/security-tests");
  const { date: today } = nowInIndia();
  const ctx: SecurityContext = { role: user.role as SecurityContext["role"], yesterday: addDays(today, -1) };

  if (user.role === "PATIENT") {
    const mehta = await db.doctorProfile.findFirst({ where: { user: { email: "doctor@demo.com" } } });
    const taken = await db.appointment.findFirst({ where: { patientId: { not: user.id }, date: { gte: today }, status: { in: ["REQUESTED", "CONFIRMED"] } } });
    const pending = await db.doctorProfile.findFirst({ where: { verificationStatus: "PENDING" } });
    const upcoming = await db.appointment.findFirst({ where: { patientId: user.id, status: { in: ["REQUESTED", "CONFIRMED"] } } });
    Object.assign(ctx, {
      mehtaId: mehta?.id,
      takenSlot: taken ? { doctorId: taken.doctorId, date: taken.date, startMinute: taken.startMinute } : undefined,
      pendingDoctorId: pending?.id,
      futureDate: addDays(today, 2),
      upcomingApptId: upcoming?.id,
    });
  }
  if (user.role === "DOCTOR" && user.doctorProfile) {
    const other = await db.appointment.findFirst({ where: { doctorId: { not: user.doctorProfile.id }, status: "REQUESTED" } });
    ctx.otherDoctorApptId = other?.id;
  }
  if (user.role === "ADMIN") {
    const used = await db.specialisation.findFirst({ where: { doctors: { some: {} } }, orderBy: { name: "asc" } });
    ctx.usedSpecId = used?.id;
    ctx.usedSpecName = used?.name;
  }

  const body = (
    <>
      <PageTitle eyebrow="For the demo" title="Security tests" sub="Each button skips the normal form and sends a tampered request straight to the server. A green result means the server blocked it." />
      <SecurityTests ctx={ctx} />
    </>
  );
  if (user.role === "ADMIN") return <Portal title="Admin" links={ADMIN_LINKS}>{body}</Portal>;
  if (user.role === "DOCTOR") return <Portal title="Doctor portal" links={DOCTOR_LINKS}>{body}</Portal>;
  return <Shell>{body}</Shell>;
}
