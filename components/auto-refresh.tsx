"use client";
// Keeps a page up to date: quietly reloads its data every few seconds while
// the tab is visible (so a doctor's "Accept" shows up on the patient's screen).
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ every = 6000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, every);
    return () => clearInterval(id);
  }, [router, every]);
  return null;
}
