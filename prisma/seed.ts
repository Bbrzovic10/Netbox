/**
 * Seed: legt genau EIN Muster-Profil an, damit man die App sofort ausprobieren
 * kann. Keine Kunden – die werden manuell in der App erfasst.
 *
 * Muster-Login:
 *   Name:     Max Muster
 *   Passwort: muster
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// .env laden – tsx tut das (anders als die Prisma-CLI) nicht automatisch.
if (!process.env.DATABASE_URL) {
  try {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* keine .env vorhanden – dann muss DATABASE_URL anders gesetzt sein */
  }
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("muster", 10);

  await prisma.user.upsert({
    where: { name: "Max Muster" },
    update: { farbe: "#06b6d4", passwordHash },
    create: {
      name: "Max Muster",
      farbe: "#06b6d4",
      passwordHash,
    },
  });

  console.log("✔ Seed fertig: Muster-Profil „Max Muster“ (Passwort: muster).");
  console.log("  Keine Kunden angelegt – bitte manuell in der App erfassen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
