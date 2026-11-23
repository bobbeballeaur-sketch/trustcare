// GET /api/notifications/count — unread notifications for the bell icon.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unread: 0 });
  const unread = await db.notification.count({ where: { userId: user.id, isRead: false } });
  return NextResponse.json({ unread });
}
