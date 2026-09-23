"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Users,
  Moon,
  Sun,
  Network,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { useCurrentUser } from "@/components/current-user";
import { useTheme } from "@/components/theme-provider";
import { UserGate } from "@/components/user-gate";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users },
  { href: "/activity", label: "Aktivität", icon: Activity },
];

/**
 * Rahmen der App: obere Navigationsleiste + erzwungene Benutzerauswahl.
 * Solange kein User in LocalStorage steht, blockt der UserGate die App.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready } = useCurrentUser();
  const { theme, toggle } = useTheme();
  const [gateOpen, setGateOpen] = React.useState(false);

  // Kein User gewaehlt -> Auswahl erzwingen.
  const forced = ready && !user;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Network className="size-4" />
            </span>
            <span className="hidden sm:inline">
              NetBox Tracker
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Sowacom
              </span>
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {user && (
              <button
                onClick={() => setGateOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/60 py-1 pl-1 pr-2 text-sm transition-colors hover:bg-accent"
                title="Benutzer wechseln"
              >
                <Avatar name={user.name} farbe={user.farbe} size="xs" />
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {user.name}
                </span>
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        {ready ? (
          children
        ) : (
          <div className="py-24 text-center text-muted-foreground">Lädt…</div>
        )}
      </main>

      {/* Benutzerwahl: erzwungen, wenn keiner gewaehlt ist. */}
      <UserGate
        open={gateOpen || forced}
        onOpenChange={setGateOpen}
        forced={forced}
      />
    </div>
  );
}
