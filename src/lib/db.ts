import { PrismaClient } from "@prisma/client";

/**
 * Prisma-Client als Singleton. Im Dev-Modus wird bei Hot-Reload sonst pro
 * Reload eine neue Verbindung aufgemacht ("too many connections").
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
