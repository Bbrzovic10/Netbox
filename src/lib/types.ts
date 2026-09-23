import type { CustomerStatus } from "@prisma/client";

/** Oeffentliche User-Daten (ohne Passwort-Hash). */
export interface PublicUser {
  id: string;
  name: string;
  farbe: string;
  createdAt: string;
}

/** Ein User, der gerade an einem Kunden arbeitet. */
export interface ActiveUser {
  id: string;
  name: string;
  farbe: string;
  startedAt: string;
}

/** Kunde inkl. abgeleiteter Live-Infos fuer Dashboard/Detail. */
export interface CustomerDTO {
  id: string;
  name: string;
  notizen: string | null;
  status: CustomerStatus;
  assignee: { id: string; name: string; farbe: string } | null;
  activeUsers: ActiveUser[];
  createdAt: string;
  updatedAt: string;
}

/** Ein Eintrag im Aktivitaets-Log. */
export interface ActivityDTO {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string; farbe: string } | null;
  customer: { id: string; name: string } | null;
}

/** Team-View: pro User seine aktuell offenen ActiveWork-Eintraege. */
export interface TeamMemberDTO {
  user: PublicUser;
  working: { customerId: string; customerName: string; startedAt: string }[];
}
