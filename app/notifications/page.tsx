// Notifications for every role (the bell). Updates live.
import Link from "next/link";
import { Bell } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Shell, PageTitle, EmptyState } from "@/components/shell";
import { AutoRefresh } from "@/components/auto-refresh";
import { MarkRead } from "@/components/mark-read";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireRole(["PATIENT", "DOCTOR", "ADMIN"], "/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = items.filter((n) => !n.isRead).length;
  return (
    <Shell>
      <AutoRefresh every={5000} />
      <PageTitle title="Notifications" sub={unread ? `${unread} unread` : "You're all caught up."}>
        {unread > 0 && <MarkRead label="Mark all as read" />}
      </PageTitle>
      {items.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id} className={`flex flex-wrap items-start gap-4 rounded-2xl border p-4 ${n.isRead ? "border-line bg-white" : "border-ink bg-soft"}`}>
              <Bell size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{!n.isRead && <span className="mr-2 rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">NEW</span>}{n.title}</p>
                <p className="text-ink-2">{n.message}</p>
                <p className="mt-1 text-xs text-ink-2">{n.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <div className="flex gap-1">
                {n.link && <Link href={n.link} className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-white">{n.title.includes("leave") || n.title.includes("cancelled") ? "Rebook / view" : "Open"}</Link>}
                {!n.isRead && <MarkRead id={n.id} label="Mark as read" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
