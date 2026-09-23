import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activeCutoff, pruneExpiredActiveWork } from "@/lib/active-work";
import type { TeamMemberDTO } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/active-work – Team-View: jeder User mit seinen aktuell offenen
 * "arbeitet gerade an"-Eintraegen (abgelaufene sind rausgefiltert).
 */
export async function GET() {
  await pruneExpiredActiveWork();

  const [users, active] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, farbe: true, createdAt: true },
    }),
    prisma.activeWork.findMany({
      where: { lastPing: { gte: activeCutoff() } },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const byUser = new Map<string, TeamMemberDTO["working"]>();
  for (const w of active) {
    const list = byUser.get(w.userId) ?? [];
    list.push({
      customerId: w.customer.id,
      customerName: w.customer.name,
      startedAt: w.startedAt.toISOString(),
    });
    byUser.set(w.userId, list);
  }

  const result: TeamMemberDTO[] = users.map((u) => ({
    user: { ...u, createdAt: u.createdAt.toISOString() },
    working: byUser.get(u.id) ?? [],
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/active-work – "Ich arbeite jetzt daran" bzw. Heartbeat.
 * Body: { userId, customerId }. Legt den Eintrag an oder frischt lastPing auf.
 */
export async function POST(req: Request) {
  try {
    const { userId, customerId } = await req.json();
    if (typeof userId !== "string" || typeof customerId !== "string") {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const existing = await prisma.activeWork.findUnique({
      where: { userId_customerId: { userId, customerId } },
    });

    if (existing) {
      await prisma.activeWork.update({
        where: { id: existing.id },
        data: { lastPing: new Date() },
      });
      return NextResponse.json({ ok: true, created: false });
    }

    // Neu -> anlegen und im Log vermerken.
    const [user, customer] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true },
      }),
    ]);
    if (!user || !customer) {
      return NextResponse.json(
        { error: "User oder Kunde nicht gefunden." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.activeWork.create({ data: { userId, customerId } }),
      prisma.activityLog.create({
        data: {
          customerId,
          userId,
          message: `${user.name} arbeitet jetzt an „${customer.name}“`,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, created: true });
  } catch (err) {
    console.error("POST /api/active-work", err);
    return NextResponse.json(
      { error: "Konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/active-work – Bearbeitung beenden.
 * Body: { userId, customerId }.
 */
export async function DELETE(req: Request) {
  try {
    const { userId, customerId } = await req.json();
    if (typeof userId !== "string" || typeof customerId !== "string") {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    await prisma.activeWork.deleteMany({ where: { userId, customerId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/active-work", err);
    return NextResponse.json(
      { error: "Konnte nicht beendet werden." },
      { status: 500 },
    );
  }
}
