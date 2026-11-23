// 404 page.
import Link from "next/link";
import { Shell } from "@/components/shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-serif text-8xl">404</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-ink-2">It may have moved, or the doctor may no longer be listed.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Home</Link>
          <Link href="/doctors" className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">Find a doctor</Link>
        </div>
      </div>
    </Shell>
  );
}
