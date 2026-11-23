"use client";
// Accessible pop-up built on the native <dialog>: keeps focus inside while
// open, closes with Esc, and returns focus to the button that opened it.
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(94vw,560px)] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      {open && (
        <div className="max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="dialog-title" className="text-xl font-medium">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-soft">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
