"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, History } from "lucide-react";
import { api } from "@/lib/fetcher";
import type { ActivityDTO } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/utils";

/** Globaler Aktivitaets-Log: letzte Statusaenderungen und Bearbeitungen. */
export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api<ActivityDTO[]>("/api/activity"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktivität</h1>
        <p className="text-sm text-muted-foreground">
          Die letzten Statusänderungen und Bearbeitungen im Überblick.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Lädt…
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
          <History className="mx-auto mb-2 size-6 opacity-60" />
          Noch keine Aktivität.
        </div>
      ) : (
        <Card className="p-2">
          <div className="relative">
            {/* Zeitstrahl-Linie */}
            <div className="absolute bottom-2 left-[1.35rem] top-2 w-px bg-border" />
            <AnimatePresence initial={false}>
              {data.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                >
                  <div className="z-10">
                    {a.user ? (
                      <Avatar
                        name={a.user.name}
                        farbe={a.user.farbe}
                        size="sm"
                      />
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background">
                        <History className="size-4" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm leading-snug">
                      {a.message}
                      {a.customer && (
                        <>
                          {" · "}
                          <Link
                            href={`/customers/${a.customer.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {a.customer.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.user ? `${a.user.name} · ` : ""}
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </div>
  );
}
