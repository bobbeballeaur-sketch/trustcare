// Page shell for every inner page: header, a centred main area, footer and
// the floating voice assistant. Also small shared display pieces.
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { VoiceAssistant } from "./voice-assistant";
import { Ban, CalendarClock, CircleCheck, CircleX, Hourglass, RefreshCw, TriangleAlert } from "lucide-react";
import type { AppointmentStatus } from "@prisma/client";

export function Shell({ children, wide = false, footer = true }: { children: React.ReactNode; wide?: boolean; footer?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className={`mx-auto w-full px-4 pb-24 pt-28 sm:px-6 ${wide ? "max-w-[1320px]" : "max-w-6xl"}`}>
        {children}
      </main>
      {footer && <SiteFooter />}
      <VoiceAssistant />
    </>
  );
}

export function PageTitle({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="eyebrow mb-3 inline-flex items-center gap-2 text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> {eyebrow}
          </p>
        )}
        <h1 className="text-[clamp(1.9rem,3.6vw,2.7rem)] font-medium leading-tight tracking-[-0.03em]">{title}</h1>
        {sub && <p className="mt-2 text-ink-2">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const STATUS: Record<AppointmentStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  REQUESTED: { label: "Requested", cls: "bg-warn-soft text-warn", Icon: Hourglass },
  CONFIRMED: { label: "Confirmed", cls: "bg-ok-soft text-ok", Icon: CircleCheck },
  DECLINED: { label: "Declined", cls: "bg-card text-ink-2", Icon: Ban },
  CANCELLED: { label: "Cancelled", cls: "bg-danger-soft text-danger", Icon: CircleX },
  COMPLETED: { label: "Completed", cls: "bg-info-soft text-[#284a7a]", Icon: CalendarClock },
  NO_SHOW: { label: "No-show", cls: "bg-card text-ink-2", Icon: TriangleAlert },
};

/** Status shown with an icon AND a word, never colour alone. */
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <s.Icon size={14} aria-hidden="true" /> {s.label}
    </span>
  );
}

export function EmptyState({ title, text, href, cta }: { title: string; text?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-soft px-6 py-14 text-center">
      <RefreshCw size={28} className="text-ink-3" aria-hidden="true" />
      <p className="mt-3 text-lg font-medium">{title}</p>
      {text && <p className="mt-1 max-w-md text-ink-2">{text}</p>}
      {href && cta && (
        <Link href={href} className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-ink/85">{cta}</Link>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-white p-5 sm:p-6 ${className}`}>{children}</section>;
}

export { btn } from "./shell-buttons";
