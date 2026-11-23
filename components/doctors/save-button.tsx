"use client";
// Heart button to save / unsave a doctor (patients only).
import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSavedAction } from "@/lib/actions/patient";
import { useApp } from "../providers";
import { pick } from "@/lib/i18n";

export function SaveButton({ doctorId, doctorName, initial, canSave, withText = false }: { doctorId: string; doctorName: string; initial: boolean; canSave: boolean; withText?: boolean }) {
  const { lang, toast } = useApp();
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const cls = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#cfc9bf] bg-white text-sm font-medium hover:bg-soft ${withText ? "px-4" : "w-11"}`;
  const label = saved ? pick(lang, "Saved", "सहेजा") : pick(lang, "Save", "सहेजें");
  if (!canSave)
    return (
      <Link href={`/login?next=/doctors/${doctorId}`} className={cls} aria-label={`${pick(lang, "Log in to save", "सहेजने के लिए लॉग इन")} ${doctorName}`}>
        <Heart size={18} aria-hidden="true" />{withText && label}
      </Link>
    );
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      aria-label={`${saved ? "Unsave" : "Save"} ${doctorName}`}
      className={cls}
      onClick={() =>
        start(async () => {
          const r = await toggleSavedAction(doctorId);
          setSaved(r.saved);
          toast(r.saved ? `${doctorName} saved.` : `${doctorName} removed from saved.`);
        })
      }
    >
      <Heart size={18} aria-hidden="true" className={saved ? "fill-danger text-danger" : ""} />
      {withText && label}
    </button>
  );
}
