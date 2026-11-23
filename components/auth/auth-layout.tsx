// Two-column layout for log in and sign up: a warm panel and the form.
import Link from "next/link";
import { Logo } from "../logo";

export function AuthLayout({ title, sub, side, children }: { title: string; sub: string; side: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen gap-3 p-2 sm:p-3 lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden rounded-[28px] bg-[radial-gradient(120%_100%_at_0%_0%,#f08a4b_0%,#c4561f_35%,#4a1c0a_80%,#1c0d06_100%)] p-10 text-white lg:flex lg:flex-col">
        <Link href="/" className="w-fit rounded-lg" aria-label="TrustCare home"><Logo /></Link>
        <div className="mt-auto">{side}</div>
      </div>
      <main id="main" className="flex items-center justify-center px-3 py-24 lg:py-10">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-medium tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-ink-2">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
