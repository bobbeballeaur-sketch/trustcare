// Server part of the header: finds out who is logged in, then hands that to
// the interactive navigation bar.
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavBar, type NavUser } from "./nav-bar";

export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const user = await getCurrentUser();
  let navUser: NavUser | null = null;
  if (user) {
    const unread = await db.notification.count({ where: { userId: user.id, isRead: false } });
    navUser = { name: user.name, role: user.role, unread };
  }
  return <NavBar user={navUser} overlay={overlay} />;
}
