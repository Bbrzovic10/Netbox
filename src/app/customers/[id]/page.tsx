"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Play,
  Radio,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { CustomerStatus } from "@prisma/client";
import { api } from "@/lib/fetcher";
import type { ActivityDTO, CustomerDTO, PublicUser } from "@/lib/types";
import {
  statusSentence,
  STATUS_ORDER,
  STATUS_PROGRESS,
  STATUS_SHORT,
  STATUS_BAR_CLASS,
} from "@/lib/status";
import { cn, timeAgo } from "@/lib/utils";
import { useCurrentUser } from "@/components/current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const UNASSIGNED = "__none__";

interface DetailResponse {
  customer: CustomerDTO;
  activities: Pick<ActivityDTO, "id" | "message" | "createdAt" | "user">[];
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api<DetailResponse>(`/api/customers/${id}`),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<PublicUser[]>("/api/users"),
    refetchInterval: false,
  });

  const customer = data?.customer;

  // ---- Mutationen ----------------------------------------------------------
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customer", id] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["activity"] });
    queryClient.invalidateQueries({ queryKey: ["team"] });
  };

  const patch = useMutation({
    mutationFn: (payload: Partial<Record<string, unknown>>) =>
      api<CustomerDTO>(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...payload, actorUserId: user?.id }),
      }),
    onSuccess: () => invalidate(),
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen"),
  });

  const del = useMutation({
    mutationFn: () =>
      api(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Kunde gelöscht");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen"),
  });

  // "Ich arbeite jetzt daran" -----------------------------------------------
  const amWorking = !!customer?.activeUsers.some((u) => u.id === user?.id);

  const toggleWork = useMutation({
    mutationFn: (start: boolean) =>
      api("/api/active-work", {
        method: start ? "POST" : "DELETE",
        body: JSON.stringify({ userId: user?.id, customerId: id }),
      }),
    onSuccess: () => invalidate(),
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  // Heartbeat alle 60s, solange ich als "arbeitend" markiert bin.
  React.useEffect(() => {
    if (!amWorking || !user) return;
    const t = setInterval(() => {
      api("/api/active-work", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, customerId: id }),
      }).catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, [amWorking, user, id]);

  // ---- Inline-Edit: Name ---------------------------------------------------
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  React.useEffect(() => {
    if (customer && !editingName) setNameDraft(customer.name);
  }, [customer, editingName]);

  // ---- Inline-Edit: Notizen ------------------------------------------------
  const [notesDraft, setNotesDraft] = React.useState("");
  const [notesDirty, setNotesDirty] = React.useState(false);
  React.useEffect(() => {
    if (customer && !notesDirty) setNotesDraft(customer.notizen ?? "");
  }, [customer, notesDirty]);

  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Lädt…
      </div>
    );
  }
  if (isError || !customer) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Kunde nicht gefunden.</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="/">
            <ArrowLeft className="size-4" /> Zurück zum Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const progress = STATUS_PROGRESS[customer.status];
  const otherWorkers = customer.activeUsers.filter((u) => u.id !== user?.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Zurueck */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
      </Button>

      {/* Kopf */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-10 text-xl font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    patch.mutate({ name: nameDraft });
                    setEditingName(false);
                  }
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
              <Button
                size="icon"
                onClick={() => {
                  patch.mutate({ name: nameDraft });
                  setEditingName(false);
                }}
              >
                <Check className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingName(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="group flex items-center gap-2 text-left"
            >
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {customer.name}
              </h1>
              <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {statusSentence(customer.status, customer.assignee?.name)}
          </p>
        </div>
        <StatusBadge status={customer.status} className="mt-1" />
      </div>

      {/* Fortschritt */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", STATUS_BAR_CLASS[customer.status])}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Linke Spalte: Steuerung */}
        <div className="space-y-6">
          {/* Status + Zuweisung */}
          <Card className="p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-col gap-2">
                  {STATUS_ORDER.map((s) => (
                    <StatusOption
                      key={s}
                      status={s}
                      active={customer.status === s}
                      onSelect={() => patch.mutate({ status: s })}
                      disabled={patch.isPending}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zugewiesen an</Label>
                <Select
                  value={customer.assignee?.id ?? UNASSIGNED}
                  onValueChange={(v) =>
                    patch.mutate({ assigneeId: v === UNASSIGNED ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Niemand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Niemand</SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customer.assignee && (
                  <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                    <Avatar
                      name={customer.assignee.name}
                      farbe={customer.assignee.farbe}
                      size="xs"
                    />
                    {customer.assignee.name}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Notizen (Inline-Edit) */}
          <Card className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <Label>Notizen</Label>
              {notesDirty && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNotesDraft(customer.notizen ?? "");
                      setNotesDirty(false);
                    }}
                  >
                    Verwerfen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      patch.mutate({ notizen: notesDraft });
                      setNotesDirty(false);
                    }}
                  >
                    <Check className="size-4" /> Speichern
                  </Button>
                </div>
              )}
            </div>
            <Textarea
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setNotesDirty(true);
              }}
              placeholder="Notizen zu diesem Kunden…"
              className="min-h-[120px]"
            />
          </Card>

          {/* Gefahrenzone */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" /> Kunde löschen
            </Button>
          </div>
        </div>

        {/* Rechte Spalte: Live-Arbeit + Log */}
        <div className="space-y-6">
          {/* Ich arbeite jetzt daran */}
          <Card className="p-5">
            <Label className="mb-3 block">Arbeitsstatus</Label>
            {amWorking ? (
              <Button
                variant="secondary"
                className="w-full border-status-done/40 text-status-done"
                onClick={() => toggleWork.mutate(false)}
                disabled={toggleWork.isPending}
              >
                {toggleWork.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Square className="size-4" />
                )}
                Bearbeitung beenden
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => toggleWork.mutate(true)}
                disabled={toggleWork.isPending || !user}
              >
                {toggleWork.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Ich arbeite jetzt daran
              </Button>
            )}

            {/* Andere Live-Arbeiter */}
            {otherWorkers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="flex items-center gap-1.5 text-xs text-status-done">
                  <Radio className="size-3" /> Gerade aktiv
                </p>
                {otherWorkers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-sm">
                    <Avatar name={u.name} farbe={u.farbe} size="xs" live />
                    <span>{u.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      seit {timeAgo(u.startedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Aktivitaets-Log (kundenspezifisch) */}
          <Card className="p-5">
            <Label className="mb-3 block">Verlauf</Label>
            <div className="space-y-3">
              {data && data.activities.length > 0 ? (
                data.activities.map((a) => (
                  <div key={a.id} className="flex gap-2.5 text-sm">
                    {a.user ? (
                      <Avatar
                        name={a.user.name}
                        farbe={a.user.farbe}
                        size="xs"
                        className="mt-0.5 shrink-0"
                      />
                    ) : (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                    )}
                    <div className="min-w-0">
                      <p className="leading-snug">{a.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.user ? `${a.user.name} · ` : ""}
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Noch keine Einträge.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Loesch-Bestaetigung */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kunde löschen?</DialogTitle>
            <DialogDescription>
              „{customer.name}“ und der zugehörige Verlauf werden dauerhaft
              entfernt. Das kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => del.mutate()}
              disabled={del.isPending}
            >
              {del.isPending && <Loader2 className="size-4 animate-spin" />}
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Eine anklickbare Status-Zeile mit ausformuliertem Satz-Hinweis. */
function StatusOption({
  status,
  active,
  onSelect,
  disabled,
}: {
  status: CustomerStatus;
  active: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled || active}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full border",
          active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
        )}
      >
        {active && <Check className="size-3" />}
      </span>
      {STATUS_SHORT[status]}
    </button>
  );
}
