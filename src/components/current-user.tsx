"use client";

import * as React from "react";

/** Der aktuell im Browser gewaehlte User (nur Anzeige-Daten, kein Passwort). */
export interface CurrentUser {
  id: string;
  name: string;
  farbe: string;
}

const STORAGE_KEY = "netbox_current_user";

interface Ctx {
  user: CurrentUser | null;
  ready: boolean; // true, sobald LocalStorage gelesen wurde
  setUser: (u: CurrentUser) => void;
  clear: () => void;
}

const CurrentUserContext = React.createContext<Ctx | null>(null);

/**
 * Haelt den gewaehlten User in React-State + LocalStorage synchron.
 * Kein echtes Login – der Name wird lokal gemerkt; zum Handeln als User ist
 * beim Wechsel aber das Passwort noetig (siehe UserGate).
 */
export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] = React.useState<CurrentUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch {
      /* LocalStorage nicht verfuegbar -> anonym starten */
    }
    setReady(true);
  }, []);

  const setUser = React.useCallback((u: CurrentUser) => {
    setUserState(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const clear = React.useCallback(() => {
    setUserState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, ready, setUser, clear }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): Ctx {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx)
    throw new Error("useCurrentUser muss innerhalb von CurrentUserProvider stehen");
  return ctx;
}
