import { NextResponse } from "next/server";
import type { CustomerStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pruneExpiredActiveWork, activeCutoff } from "@/lib/active-work";
import { toCustomerDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Einbindung fuer Kunden inkl. aktiver (nicht abgelaufener) Arbeiter.
 * Als Funktion, damit der 30-Min-Cutoff bei jedem Request neu berechnet wird.
 */
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

/** GET /api/customers – alle Kunden mit Live-Infos. */
export async function GET() {
  await pruneExpiredActiveWork();

  const customers = await prisma.customer.findMany({
    include: buildInclude(),
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(customers.map(toCustomerDTO));
}

/**
 * POST /api/customers – neuen Kunden anlegen.
 * Body: { name, notizen?, status?, assigneeId?, actorUserId? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, notizen, status, assigneeId, actorUserId } = body;

    if (typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Bitte einen Kundennamen angeben." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        notizen: typeof notizen === "string" ? notizen : null,
        status: (status as CustomerStatus) ?? "AUFGENOMMEN",
        assigneeId: typeof assigneeId === "string" ? assigneeId : null,
      },
      include: buildInclude(),
    });

    // Aktivitaets-Log
    await prisma.activityLog.create({
      data: {
        customerId: customer.id,
        userId: typeof actorUserId === "string" ? actorUserId : null,
        message: `Kunde „${customer.name}“ angelegt`,
      },
    });

    return NextResponse.json(toCustomerDTO(customer), { status: 201 });
  } catch (err) {
    console.error("POST /api/customers", err);
    return NextResponse.json(
      { error: "Kunde konnte nicht angelegt werden." },
      { status: 500 },
    );
  }
}
