// Small labels for consultation type and payment (icon + word, never colour alone).
import type { ConsultMode, PaymentStatus } from "@prisma/client";

export function ModeBadge({ mode }: { mode: ConsultMode }) {
  return mode === "VIDEO"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-[#efe7ff] px-2.5 py-1 text-xs font-semibold text-[#4b2a8a]">🎥 Video consult</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 text-xs font-semibold">🏥 In clinic</span>;
}

export function PayBadge({ status, fee }: { status: PaymentStatus; fee: number }) {
  if (status === "PAID") return <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">✓ Paid ₹{fee}</span>;
  if (status === "REFUNDED") return <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-[#284a7a]">↩ Refunded ₹{fee}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">₹{fee} · Unpaid</span>;
}
