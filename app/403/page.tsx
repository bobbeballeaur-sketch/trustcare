// Shown when a logged-in user opens a page for another role.
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Shell } from "@/components/shell";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <Shell>
      <div className="mx-auto max-w-lg py-12 text-center">
        <ShieldX size={48} className="mx-auto text-danger" aria-hidden="true" />
        <p className="eyebrow mt-4 text-ink-2">Error 403</p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight">Access denied</h1>
        <p className="mt-3 text-ink-2">Your account doesn&apos;t have permission to open this page. Patients, doctors and admins each have their own pages.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Go to the home page</Link>
          <Link href="/login" className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">Log in as someone else</Link>
        </div>
      </div>
    </Shell>
  );
}
