"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { api } from "@/lib/fetcher";
import { useCurrentUser } from "@/components/current-user";
import { STATUS_SHORT } from "@/lib/status";
import type { CustomerDTO, PublicUser } from "@/lib/types";
import type { CustomerStatus } from "@prisma/client";

const UNASSIGNED = "__none__";

/** Dialog zum Anlegen eines neuen Kunden (manuell – nichts vorbefuellt). */
export function NewCustomerDialog() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [notizen, setNotizen] = React.useState("");
  const [status, setStatus] = React.useState<CustomerStatus>("AUFGENOMMEN");
  const [assigneeId, setAssigneeId] = React.useState<string>(UNASSIGNED);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<PublicUser[]>("/api/users"),
    refetchInterval: false,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api<CustomerDTO>("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          notizen: notizen || null,
          status,
          assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
          actorUserId: user?.id,
        }),
      }),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast.success(`Kunde „${c.name}“ angelegt`);
      // Zuruecksetzen
      setName("");
      setNotizen("");
      setStatus("AUFGENOMMEN");
      setAssigneeId(UNASSIGNED);
      setOpen(false);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Fehler beim Anlegen"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Neuer Kunde
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Kunden anlegen</DialogTitle>
          <DialogDescription>
            Lege einen Kunden für die NetBox-Erfassung an und weise ihn optional
            direkt jemandem zu.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length < 1) {
              toast.error("Bitte einen Kundennamen angeben.");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cname">Kundenname</Label>
            <Input
              id="cname"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Muster AG"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CustomerStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["AUFGENOMMEN", "IN_BEARBEITUNG", "ERLEDIGT"] as CustomerStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_SHORT[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zugewiesen an</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnotes">Notizen (optional)</Label>
            <Textarea
              id="cnotes"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              placeholder="z.B. Ansprechpartner, Standort, Besonderheiten…"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
