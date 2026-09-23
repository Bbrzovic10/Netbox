import type { CustomerDTO } from "@/lib/types";

/**
 * Typ des Prisma-Ergebnisses, das wir fuer einen Kunden laden
 * (mit assignee + aktiven Arbeitern).
 */
export type CustomerWithRelations = {
  id: string;
  name: string;
  notizen: string | null;
  status: CustomerDTO["status"];
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; name: string; farbe: string } | null;
  activeWork: {
    startedAt: Date;
    user: { id: string; name: string; farbe: string };
  }[];
};

/** Wandelt einen Prisma-Kunden in das DTO fuers Frontend. */
export function toCustomerDTO(c: CustomerWithRelations): CustomerDTO {
  return {
    id: c.id,
    name: c.name,
    notizen: c.notizen,
    status: c.status,
    assignee: c.assignee,
    activeUsers: c.activeWork.map((w) => ({
      id: w.user.id,
      name: w.user.name,
      farbe: w.user.farbe,
      startedAt: w.startedAt.toISOString(),
    })),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
