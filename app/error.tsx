"use client";
// General error page, styled to match the site.
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-lg px-4 py-40 text-center">
      <h1 className="text-3xl font-medium tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-ink-2">Please try again. If it keeps happening, go back to the home page.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">Try again</button>
        <Link href="/" className="rounded-full border border-[#cfc9bf] px-5 py-3 text-sm font-medium">Home</Link>
      </div>
    </main>
  );
}
