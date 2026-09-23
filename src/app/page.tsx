"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleDashed,
  CircleDot,
  CheckCircle2,
  Radio,
  Loader2,
  Search,
  Inbox,
} from "lucide-react";
import type { CustomerStatus } from "@prisma/client";
import { api } from "@/lib/fetcher";
import type { CustomerDTO } from "@/lib/types";
import { STATUS_PROGRESS, STATUS_SHORT } from "@/lib/status";
import { cn } from "@/lib/utils";
import { CustomerCard } from "@/components/customer-card";
import { NewCustomerDialog } from "@/components/new-customer-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "ALL" | CustomerStatus;
type SortKey = "recent" | "progress" | "name";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Alle" },
  { key: "AUFGENOMMEN", label: STATUS_SHORT.AUFGENOMMEN },
  { key: "IN_BEARBEITUNG", label: STATUS_SHORT.IN_BEARBEITUNG },
  { key: "ERLEDIGT", label: STATUS_SHORT.ERLEDIGT },
];

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [q, setQ] = React.useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api<CustomerDTO[]>("/api/customers"),
  });

  const stats = React.useMemo(() => {
    const list = customers ?? [];
    return {
      total: list.length,
      open: list.filter((c) => c.status === "AUFGENOMMEN").length,
      progress: list.filter((c) => c.status === "IN_BEARBEITUNG").length,
      done: list.filter((c) => c.status === "ERLEDIGT").length,
      live: list.filter((c) => c.activeUsers.length > 0).length,
    };
  }, [customers]);

  const visible = React.useMemo(() => {
    let list = [...(customers ?? [])];
    if (statusFilter !== "ALL")
      list = list.filter((c) => c.status === statusFilter);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.assignee?.name.toLowerCase().includes(needle),
      );
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress")
        return STATUS_PROGRESS[b.status] - STATUS_PROGRESS[a.status];
      return +new Date(b.updatedAt) - +new Date(a.updatedAt); // recent
    });
    return list;
  }, [customers, statusFilter, q, sort]);

  return (
    <div className="space-y-6">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Überblick über die NetBox-Erfassung aller Kunden.
          </p>
        </div>
        <NewCustomerDialog />
      </div>

      {/* Statistik-Kacheln */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Kunden"
          value={stats.total}
          icon={<Inbox className="size-4" />}
        />
        <StatTile
          label={STATUS_SHORT.AUFGENOMMEN}
          value={stats.open}
          icon={<CircleDashed className="size-4" />}
          tone="open"
        />
        <StatTile
          label={STATUS_SHORT.IN_BEARBEITUNG}
          value={stats.progress}
          icon={<CircleDot className="size-4" />}
          tone="progress"
        />
        <StatTile
          label={STATUS_SHORT.ERLEDIGT}
          value={stats.done}
          icon={<CheckCircle2 className="size-4" />}
          tone="done"
        />
        <StatTile
          label="Live aktiv"
          value={stats.live}
          icon={<Radio className="size-4" />}
          tone="done"
          pulse={stats.live > 0}
        />
      </div>

      {/* Filterleiste */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kunde suchen…"
            className="pl-8"
          />
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Zuletzt aktiv</SelectItem>
            <SelectItem value="progress">Fortschritt</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Karten-Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Kunden werden geladen…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState hasCustomers={(customers?.length ?? 0) > 0} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/** Kleine Statistik-Kachel. */
function StatTile({
  label,
  value,
  icon,
  tone,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "open" | "progress" | "done";
  pulse?: boolean;
}) {
  const toneClass =
    tone === "open"
      ? "text-status-open"
      : tone === "progress"
        ? "text-status-progress"
        : tone === "done"
          ? "text-status-done"
          : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className={cn(toneClass, pulse && "animate-pulse")}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

/** Leerzustand: entweder gar keine Kunden oder nur gefiltert leer. */
function EmptyState({ hasCustomers }: { hasCustomers: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="size-6" />
      </div>
      <h3 className="font-semibold">
        {hasCustomers ? "Keine Treffer" : "Noch keine Kunden"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasCustomers
          ? "Für diese Filter gibt es keine Kunden. Passe Filter oder Suche an."
          : "Lege oben rechts über „Neuer Kunde“ den ersten Kunden an."}
      </p>
    </div>
  );
}
