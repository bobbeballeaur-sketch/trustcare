// GET the chat messages of one appointment (polled every few seconds).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok || !user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const messages = await db.message.findMany({ where: { appointmentId: id }, orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } });
  return NextResponse.json({
    me: user.id,
    messages: messages.map((m) => ({ id: m.id, text: m.text, mine: m.senderId === user.id, name: m.sender.name, at: m.createdAt.toISOString() })),
  });
}
