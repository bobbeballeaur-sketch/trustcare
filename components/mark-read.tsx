"use client";
// "Mark all as read" / "Mark as read" buttons for notifications.
import { useTransition } from "react";
import { markNotificationsReadAction } from "@/lib/actions/patient";
import { btn } from "./shell-buttons";

export function MarkRead({ id, label }: { id?: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className={id ? btn.ghost : btn.secondary} onClick={() => start(() => markNotificationsReadAction(id))}>
      {label}
    </button>
  );
}
