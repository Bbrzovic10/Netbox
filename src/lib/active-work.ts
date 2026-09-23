import { prisma } from "@/lib/db";

/** Nach 30 Min ohne Ping gilt "arbeitet gerade" als abgelaufen. */
export const ACTIVE_TIMEOUT_MS = 30 * 60 * 1000;

/** Zeitpunkt, vor dem ActiveWork als abgelaufen gilt. */
export function activeCutoff(): Date {
  return new Date(Date.now() - ACTIVE_TIMEOUT_MS);
}

/**
 * Loescht alle abgelaufenen ActiveWork-Eintraege. Wird bei jedem relevanten
 * Request aufgerufen (kein Cronjob noetig – reicht fuer diese App).
 */
export async function pruneExpiredActiveWork(): Promise<void> {
  await prisma.activeWork.deleteMany({
    where: { lastPing: { lt: activeCutoff() } },
  });
}
