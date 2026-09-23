"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Radio } from "lucide-react";
import type { CustomerDTO } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import {
  statusSentence,
  STATUS_BAR_CLASS,
  STATUS_PROGRESS,
} from "@/lib/status";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Kunden-Karte fuers Dashboard. Zeigt Status-Badge, ausformulierten Status-Satz
 * (Zugewiesen an / Wird bearbeitet von / Fertiggestellt von), Fortschrittsbalken,
 * Live-Avatare der aktuell Arbeitenden und die letzte Aktualisierung.
 */
export function CustomerCard({ customer }: { customer: CustomerDTO }) {
  const progress = STATUS_PROGRESS[customer.status];
  const active = customer.activeUsers;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -3 }}
    >
      <Link href={`/customers/${customer.id}`} className="group block">
        <Card className="h-full p-4 hover:border-primary/50 hover:bg-card/80 group-focus-visible:ring-2 group-focus-visible:ring-ring">
          {/* Kopf: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-semibold leading-tight">
              {customer.name}
            </h3>
            <StatusBadge status={customer.status} />
          </div>

          {/* Status-Satz mit User */}
          <p className="mt-2 text-sm text-muted-foreground">
            {statusSentence(customer.status, customer.assignee?.name)}
          </p>

          {/* Fortschrittsbalken */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Fortschritt</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn("h-full rounded-full", STATUS_BAR_CLASS[customer.status])}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Fuss: Live-Arbeiter + letzte Aktualisierung */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {active.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {active.slice(0, 4).map((u) => (
                      <Avatar
                        key={u.id}
                        name={u.name}
                        farbe={u.farbe}
                        size="xs"
                        live
                      />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-status-done">
                    <Radio className="size-3" />
                    {active.length === 1
                      ? "arbeitet gerade"
                      : `${active.length} aktiv`}
                  </span>
                </>
              ) : customer.assignee ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Avatar
                    name={customer.assignee.name}
                    farbe={customer.assignee.farbe}
                    size="xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/70">
                  niemand zugewiesen
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {timeAgo(customer.updatedAt)}
              <ArrowRight className="ml-1 size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
