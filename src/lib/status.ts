import type { CustomerStatus } from "@prisma/client";

/** Reihenfolge fuer Sortierung / Fortschrittsberechnung. */
export const STATUS_ORDER: CustomerStatus[] = [
  "AUFGENOMMEN",
  "IN_BEARBEITUNG",
  "ERLEDIGT",
];

/** Kurzes Badge-Label. */
export const STATUS_SHORT: Record<CustomerStatus, string> = {
  AUFGENOMMEN: "Aufgenommen",
  IN_BEARBEITUNG: "In Bearbeitung",
  ERLEDIGT: "Erledigt",
};

/** Fortschritt in Prozent (fuer den Balken auf der Karte). */
export const STATUS_PROGRESS: Record<CustomerStatus, number> = {
  AUFGENOMMEN: 5,
  IN_BEARBEITUNG: 55,
  ERLEDIGT: 100,
};

/**
 * Der ausformulierte Status-Satz inkl. User-Name.
 *   AUFGENOMMEN     -> "Zugewiesen an <User>"
 *   IN_BEARBEITUNG  -> "Wird von <User> bearbeitet"
 *   ERLEDIGT        -> "Fertiggestellt von <User>"
 * Gilt fuer JEDEN User, nicht nur einen bestimmten.
 */
export function statusSentence(
  status: CustomerStatus,
  assigneeName?: string | null,
): string {
  const name = assigneeName?.trim();
  switch (status) {
    case "AUFGENOMMEN":
      return name ? `Zugewiesen an ${name}` : "Noch niemandem zugewiesen";
    case "IN_BEARBEITUNG":
      return name ? `Wird von ${name} bearbeitet` : "In Bearbeitung";
    case "ERLEDIGT":
      return name ? `Fertiggestellt von ${name}` : "Erledigt";
    default:
      return STATUS_SHORT[status];
  }
}

/** Tailwind-Utility-Klassen je Status (Badge). */
export const STATUS_BADGE_CLASS: Record<CustomerStatus, string> = {
  AUFGENOMMEN:
    "bg-status-open/15 text-status-open border-status-open/30",
  IN_BEARBEITUNG:
    "bg-status-progress/15 text-status-progress border-status-progress/30",
  ERLEDIGT: "bg-status-done/15 text-status-done border-status-done/30",
};

/** Farbe des Fortschrittsbalkens je Status. */
export const STATUS_BAR_CLASS: Record<CustomerStatus, string> = {
  AUFGENOMMEN: "bg-status-open",
  IN_BEARBEITUNG: "bg-status-progress",
  ERLEDIGT: "bg-status-done",
};
