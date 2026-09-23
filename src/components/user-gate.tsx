"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/avatar";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { useCurrentUser, type CurrentUser } from "@/components/current-user";
import type { PublicUser } from "@/lib/types";

/** Auswahl an Avatar-Farben. */
const COLORS = [
  "#06b6d4", // cyan (Akzent)
  "#8b5cf6", // violett
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // rot
  "#3b82f6", // blau
  "#ec4899", // pink
  "#14b8a6", // teal
];

type View = "list" | "password" | "create";

/**
 * Der Benutzer-"Login" ohne echtes Login: Name aus Liste waehlen (+ Passwort)
 * oder neu anlegen (Name, Farbe, Passwort). Ergebnis landet in LocalStorage.
 */
export function UserGate({
  open,
  onOpenChange,
  forced = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** true = Auswahl ist Pflicht, Dialog nicht schliessbar. */
  forced?: boolean;
}) {
  const { setUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [view, setView] = React.useState<View>("list");
  const [selected, setSelected] = React.useState<PublicUser | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Create-Form
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState(COLORS[0]);
  const [newPw, setNewPw] = React.useState("");
  const [newPw2, setNewPw2] = React.useState("");

  // Login-Form
  const [pw, setPw] = React.useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<PublicUser[]>("/api/users"),
    refetchInterval: false,
    enabled: open,
  });

  // Beim Oeffnen zuruecksetzen
  React.useEffect(() => {
    if (open) {
      setView("list");
      setSelected(null);
      setPw("");
      setNewName("");
      setNewColor(COLORS[0]);
      setNewPw("");
      setNewPw2("");
    }
  }, [open]);

  function finish(u: CurrentUser) {
    setUser(u);
    onOpenChange(false);
    toast.success(`Angemeldet als ${u.name}`);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const u = await api<PublicUser>("/api/users/verify", {
        method: "POST",
        body: JSON.stringify({ userId: selected.id, password: pw }),
      });
      finish({ id: u.id, name: u.name, farbe: u.farbe });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Anmeldung fehlgeschlagen",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== newPw2) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      const u = await api<PublicUser>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          farbe: newColor,
          password: newPw,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      finish({ id: u.id, name: u.name, farbe: u.farbe });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Anlegen fehlgeschlagen",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Bei Pflicht-Auswahl kein Schliessen erlauben.
        if (forced && !o) return;
        onOpenChange(o);
      }}
    >
      <DialogContent hideClose={forced} className="max-w-md">
        {view === "list" && (
          <>
            <DialogHeader>
              <DialogTitle>Wer bist du?</DialogTitle>
              <DialogDescription>
                Wähle deinen Namen und melde dich mit deinem Passwort an – oder
                lege dir ein neues Profil an.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Lädt…
                </div>
              ) : users && users.length > 0 ? (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelected(u);
                      setPw("");
                      setView("password");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-accent"
                  >
                    <Avatar name={u.name} farbe={u.farbe} size="sm" />
                    <span className="font-medium">{u.name}</span>
                    <Lock className="ml-auto size-3.5 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Noch keine Profile vorhanden. Lege das erste an.
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setView("create")}
            >
              <UserPlus className="size-4" /> Neues Profil anlegen
            </Button>
          </>
        )}

        {view === "password" && selected && (
          <form onSubmit={handleLogin} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar name={selected.name} farbe={selected.farbe} size="sm" />
                {selected.name}
              </DialogTitle>
              <DialogDescription>
                Gib dein Passwort ein, um dich anzumelden.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="pw">Passwort</Label>
              <Input
                id="pw"
                type="password"
                autoFocus
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("list")}
              >
                <ArrowLeft className="size-4" /> Zurück
              </Button>
              <Button type="submit" className="flex-1" disabled={busy || !pw}>
                {busy && <Loader2 className="size-4 animate-spin" />} Anmelden
              </Button>
            </div>
          </form>
        )}

        {view === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Neues Profil</DialogTitle>
              <DialogDescription>
                Jeder legt beim Erstellen ein Passwort fest – damit nur du als
                du handeln kannst.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Benjamin Brzovic"
              />
            </div>

            <div className="space-y-2">
              <Label>Avatar-Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      newColor === c ? "ring-primary" : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="newpw">Passwort</Label>
                <Input
                  id="newpw"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="min. 4 Zeichen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newpw2">Wiederholen</Label>
                <Input
                  id="newpw2"
                  type="password"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("list")}
              >
                <ArrowLeft className="size-4" /> Zurück
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  busy || newName.trim().length < 2 || newPw.length < 4
                }
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Profil
                erstellen
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
