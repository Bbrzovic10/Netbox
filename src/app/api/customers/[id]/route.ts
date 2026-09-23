import { NextResponse } from "next/server";
import type { CustomerStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { activeCutoff, pruneExpiredActiveWork } from "@/lib/active-work";
import { toCustomerDTO } from "@/lib/serialize";
import { statusSentence, STATUS_SHORT } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildInclude() {
  return {
    assignee: { select: { id: true, name: true, farbe: true } },
    activeWork: {
      where: { lastPing: { gte: activeCutoff() } },
      include: { user: { select: { id: true, name: true, farbe: true } } },
      orderBy: { startedAt: "asc" as const },
    },
  };
}

/** GET /api/customers/:id – Kunde inkl. Aktivitaets-Log. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await pruneExpiredActiveWork();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: buildInclude(),
  });

  if (!customer) {
    return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  }

  const activities = await prisma.activityLog.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { id: true, name: true, farbe: true } } },
  });

  return NextResponse.json({
    customer: toCustomerDTO(customer),
    activities: activities.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
    })),
  });
}

/**
 * PATCH /api/customers/:id – Felder aktualisieren und passende Log-Eintraege
 * schreiben. Body: { name?, notizen?, status?, assigneeId?, actorUserId? }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, notizen, status, assigneeId, actorUserId } = body;

    const current = await prisma.customer.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, name: true } } },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden." },
        { status: 404 },
      );
    }

    // Nur gesetzte Felder uebernehmen.
    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim() !== current.name)
      data.name = name.trim();
    if (notizen !== undefined && notizen !== current.notizen)
      data.notizen = notizen;
    if (typeof status === "string" && status !== current.status)
      data.status = status as CustomerStatus;
    if (assigneeId !== undefined && assigneeId !== current.assigneeId)
      data.assigneeId = assigneeId; // string oder null

    const updated = await prisma.customer.update({
      where: { id },
      data,
      include: buildInclude(),
    });

    // ---- Aktivitaets-Log: sinnvolle Meldungen je nach Aenderung ----
    const logs: string[] = [];
    const assigneeName = updated.assignee?.name ?? null;

    if ("status" in data) {
      logs.push(
        `Status auf „${STATUS_SHORT[updated.status]}“ – ${statusSentence(
          updated.status,
          assigneeName,
        )}`,
      );
    }
    if ("assigneeId" in data && !("status" in data)) {
      logs.push(
        assigneeName
          ? `Zugewiesen an ${assigneeName}`
          : "Zuweisung entfernt",
      );
    }
    if ("name" in data) logs.push(`Umbenannt zu „${updated.name}“`);
    if ("notizen" in data) logs.push("Notizen aktualisiert");

    if (logs.length > 0) {
      await prisma.activityLog.createMany({
        data: logs.map((message) => ({
          customerId: id,
          userId: typeof actorUserId === "string" ? actorUserId : null,
          message,
        })),
      });
    }

    return NextResponse.json(toCustomerDTO(updated));
  } catch (err) {
    console.error("PATCH /api/customers/:id", err);
    return NextResponse.json(
      { error: "Kunde konnte nicht aktualisiert werden." },
      { status: 500 },
    );
  }
}

/** DELETE /api/customers/:id – Kunde loeschen (Cascade auf Log/ActiveWork). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/customers/:id", err);
    return NextResponse.json(
      { error: "Kunde konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
