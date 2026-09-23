"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Radio, Coffee } from "lucide-react";
import { api } from "@/lib/fetcher";
import type { TeamMemberDTO } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/utils";

/**
 * Team-View: Live-Dashboard, wer gerade an welchem Kunden arbeitet.
 * Aktualisiert sich automatisch (Polling alle 10s ueber React Query).
 */
export default function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: () => api<TeamMemberDTO[]>("/api/active-work"),
  });

  const activeCount =
    data?.filter((m) => m.working.length > 0).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            Wer arbeitet gerade an welchem Kunden?
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-done opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-status-done" />
          </span>
          <span className="tabular-nums">{activeCount}</span> aktiv
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Lädt…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          Noch keine Teammitglieder angelegt.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => {
            const isActive = m.working.length > 0;
            return (
              <motion.div
                key={m.user.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={
                    "h-full p-5 transition-colors " +
                    (isActive
                      ? "border-status-done/40 bg-status-done/[0.04]"
                      : "hover:border-primary/40")
                  }
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={m.user.name}
                      farbe={m.user.farbe}
                      size="md"
                      live={isActive}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? (
                          <span className="flex items-center gap-1 text-status-done">
                            <Radio className="size-3" /> arbeitet gerade
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Coffee className="size-3" /> gerade nichts
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {m.working.map((w) => (
                        <Link
                          key={w.customerId}
                          href={`/customers/${w.customerId}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                        >
                          <span className="truncate font-medium">
                            {w.customerName}
                          </span>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            seit {timeAgo(w.startedAt)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
