"use client";

import * as React from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrentUserProvider } from "@/components/current-user";

/**
 * Bündelt alle Client-Provider: React Query (Server-State + Polling),
 * Theme (Dark/Light) und den aktuellen User. Plus globale Toaster.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Ein QueryClient pro Browser-Session.
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Live-Charakter: alle 10s refetchen, auch im Hintergrund.
            refetchInterval: 10_000,
            refetchOnWindowFocus: true,
            staleTime: 5_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <CurrentUserProvider>{children}</CurrentUserProvider>
      </ThemeProvider>
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { borderRadius: "0.6rem" } }}
      />
    </QueryClientProvider>
  );
}
