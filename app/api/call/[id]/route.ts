// Video call signalling: the two browsers exchange connection details here.
// GET  ?after=<ms>  -> signals from the other person since that time
// POST {type, payload} -> send a signal
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAppointmentForParticipant } from "@/lib/consult";

export const dynamic = "force-dynamic";
const TYPES = ["join", "offer", "answer", "ice", "hangup"];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok || !user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const after = Number(new URL(req.url).searchParams.get("after")) || 0;
  const signals = await db.callSignal.findMany({
    where: { appointmentId: id, fromUserId: { not: user.id }, createdAt: { gt: new Date(after) } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ signals: signals.map((s) => ({ type: s.type, payload: s.payload, at: s.createdAt.getTime() })) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const ok = await getAppointmentForParticipant(user, id);
  if (!ok || !user) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  // SECURITY: video calls only for confirmed, paid video appointments.
  if (ok.a.mode !== "VIDEO" || ok.a.status !== "CONFIRMED" || ok.a.paymentStatus !== "PAID")
    return NextResponse.json({ error: "This call isn't available." }, { status: 400 });
  const body = (await req.json()) as { type?: string; payload?: string };
  if (!body.type || !TYPES.includes(body.type) || (body.payload ?? "").length > 20000) return NextResponse.json({ error: "bad signal" }, { status: 400 });
  await db.callSignal.create({ data: { appointmentId: id, fromUserId: user.id, type: body.type, payload: body.payload ?? "" } });
  return NextResponse.json({ ok: true, at: Date.now() });
}
