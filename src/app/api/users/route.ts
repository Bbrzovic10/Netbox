import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/users – Liste aller Profile (ohne Passwort-Hash). */
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, farbe: true, createdAt: true },
  });
  return NextResponse.json(users);
}

/**
 * POST /api/users – neues Profil anlegen.
 * Body: { name, farbe, password }. Passwort ist Pflicht (min. 4 Zeichen)
 * und wird als bcrypt-Hash gespeichert.
 */
export async function POST(req: Request) {
  try {
    const { name, farbe, password } = await req.json();

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Bitte einen Namen mit mindestens 2 Zeichen angeben." },
        { status: 400 },
      );
    }
    if (typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 4 Zeichen haben." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        farbe: typeof farbe === "string" ? farbe : "#06b6d4",
        passwordHash,
      },
      select: { id: true, name: true, farbe: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    // Prisma P2002 = Unique-Constraint (Name schon vergeben)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Diesen Namen gibt es schon. Bitte einen anderen wählen." },
        { status: 409 },
      );
    }
    console.error("POST /api/users", err);
    return NextResponse.json(
      { error: "Profil konnte nicht angelegt werden." },
      { status: 500 },
    );
  }
}
