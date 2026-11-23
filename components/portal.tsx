// Sidebar layout for the doctor and admin portals.
import { SiteHeader } from "./site-header";
import { VoiceAssistant } from "./voice-assistant";
import { PortalNav, type PortalLink } from "./portal-nav";

export const DOCTOR_LINKS: PortalLink[] = [
  { href: "/doctor", label: "Dashboard", icon: "dashboard" },
  { href: "/doctor/appointments", label: "Appointments", icon: "calendar" },
  { href: "/doctor/availability", label: "Availability & leave", icon: "clock" },
  { href: "/doctor/profile", label: "My profile", icon: "user" },
  { href: "/doctor/reviews", label: "Reviews", icon: "star" },
  { href: "/messages", label: "Messages & video", icon: "chat" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/security-tests", label: "Security tests", icon: "shield" },
];

export const ADMIN_LINKS: PortalLink[] = [
  { href: "/admin", label: "Analytics", icon: "chart" },
  { href: "/admin/doctors", label: "Doctor verification", icon: "badge" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/reviews", label: "Review moderation", icon: "flag" },
  { href: "/admin/specialisations", label: "Master data", icon: "list" },
  { href: "/security-tests", label: "Security tests & demo reset", icon: "shield" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
];

export function Portal({ title, links, children }: { title: string; links: PortalLink[]; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-3 pb-20 pt-24 sm:px-4 lg:flex-row">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-24 rounded-3xl bg-night p-3 text-white">
            <p className="eyebrow px-3 pb-3 pt-2 text-white/60">{title}</p>
            <PortalNav links={links} />
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
      </div>
      <VoiceAssistant />
    </>
  );
}
