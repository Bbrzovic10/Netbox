import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/users/verify – Passwort pruefen.
 * Body: { userId, password }. Bei Erfolg kommen die oeffentlichen User-Daten
 * zurueck, sonst 401. (Leichtgewichtiger Schutz – kein Session-Token.)
 */
export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json();

    if (typeof userId !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Ungültige Anfrage." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Profil nicht gefunden." },
        { status: 404 },
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Falsches Passwort." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      farbe: user.farbe,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("POST /api/users/verify", err);
    return NextResponse.json(
      { error: "Anmeldung fehlgeschlagen." },
      { status: 500 },
    );
  }
}
