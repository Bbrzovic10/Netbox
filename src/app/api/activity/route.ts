import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ActivityDTO } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/activity – die letzten 50 Aktivitaeten (global). */
export async function GET() {
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, farbe: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  const result: ActivityDTO[] = activities.map((a) => ({
    id: a.id,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
    user: a.user,
    customer: a.customer,
  }));

  return NextResponse.json(result);
}
