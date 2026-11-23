// Patient profile: account details, password, and quick links.
import Link from "next/link";
import { Heart, MessageSquare, Star, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell, PageTitle } from "@/components/shell";
import { AccountForm, PasswordForm } from "@/components/account-forms";

export const metadata = { title: "My profile" };

export default async function PatientProfile() {
  const user = await requireRole(["PATIENT"], "/patient/profile");
  const [family, saved, reviews, paid] = await Promise.all([
    db.familyMember.count({ where: { patientId: user.id } }),
    db.savedDoctor.count({ where: { patientId: user.id } }),
    db.review.count({ where: { patientId: user.id } }),
    db.appointment.aggregate({ where: { patientId: user.id, paymentStatus: "PAID" }, _sum: { fee: true }, _count: true }),
  ]);
  const links = [
    { href: "/patient/family", label: "Family members", n: family, Icon: Users },
    { href: "/patient/saved", label: "Saved doctors", n: saved, Icon: Heart },
    { href: "/patient/reviews", label: "My reviews", n: reviews, Icon: Star },
    { href: "/messages", label: "Messages & video consults", n: null, Icon: MessageSquare },
  ];
  return (
    <Shell>
      <PageTitle eyebrow="Patient" title={`Hello, ${user.name.split(" ")[0]}`} sub="Manage your account, family and saved doctors. Accessibility settings are in the ♿ button at the top." />
      <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ href, label, n, Icon }) => (
          <li key={href}><Link href={href} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-5 hover:bg-soft"><Icon size={22} aria-hidden="true" /><span className="flex-1 font-medium">{label}</span>{n !== null && <span className="rounded-full bg-soft px-2.5 py-1 text-sm">{n}</span>}</Link></li>
        ))}
      </ul>
      <p className="mb-6 rounded-2xl bg-soft p-4 text-sm">💳 Payments: <b>{paid._count}</b> paid consultation{paid._count === 1 ? "" : "s"}, total <b>₹{paid._sum.fee ?? 0}</b> (demo payments — no real money).</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="acc-h" className="rounded-3xl border border-line bg-white p-6"><h2 id="acc-h" className="mb-4 text-lg font-medium">Account details</h2><AccountForm initial={{ name: user.name, phone: user.phone, preferredLanguage: user.preferredLanguage, email: user.email }} /></section>
        <section aria-labelledby="pw-h" className="rounded-3xl border border-line bg-white p-6"><h2 id="pw-h" className="mb-4 text-lg font-medium">Change password</h2><PasswordForm /></section>
      </div>
    </Shell>
  );
}
