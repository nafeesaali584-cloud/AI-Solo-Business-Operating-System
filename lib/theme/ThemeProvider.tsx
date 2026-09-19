"use client";

import React, { useEffect, createContext, useContext, useCallback } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

// ─── Context for DB-synced theme ─────────────────────────────────────────────

interface ThemeContextValue {
  theme: string;
  setTheme: (t: string) => void;
  resolvedTheme: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  resolvedTheme: "dark",
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Inner wrapper that syncs with DB ────────────────────────────────────────

function ThemeSyncer({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  // On mount: fetch persisted preference from DB and apply
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = await res.json();
        const dbTheme = json.settings?.theme_preference;
        if (!cancelled && dbTheme && dbTheme !== theme) {
          setTheme(dbTheme);
        }
      } catch {
        // Silent — use whatever next-themes has from localStorage fallback
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist theme changes to DB
  const handleSetTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
      // Fire-and-forget DB persistence
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_preference: newTheme }),
      }).catch(() => {});
    },
    [setTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme: theme || "dark",
        setTheme: handleSetTheme,
        resolvedTheme: resolvedTheme || "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Exported provider ──────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="clientpulse-theme"
    >
      <ThemeSyncer>{children}</ThemeSyncer>
    </NextThemesProvider>
  );
}
