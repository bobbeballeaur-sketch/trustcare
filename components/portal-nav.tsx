"use client";
// Sidebar links with the current page highlighted.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Bell, CalendarDays, ChartColumn, Clock, Flag, LayoutDashboard, List, MessageSquare, ShieldCheck, Star, UserRound, Users } from "lucide-react";

export type PortalLink = { href: string; label: string; icon: keyof typeof ICONS };
const ICONS = { dashboard: LayoutDashboard, calendar: CalendarDays, clock: Clock, user: UserRound, star: Star, bell: Bell, chart: ChartColumn, badge: BadgeCheck, users: Users, flag: Flag, list: List, shield: ShieldCheck, chat: MessageSquare };

export function PortalNav({ links }: { links: PortalLink[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Portal">
      <ul className="flex flex-col gap-1">
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = path === l.href;
          return (
            <li key={l.href}>
              <Link href={l.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${active ? "bg-white font-medium text-ink" : "text-white/85 hover:bg-white/10"}`}>
                <Icon size={18} aria-hidden="true" /> {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
