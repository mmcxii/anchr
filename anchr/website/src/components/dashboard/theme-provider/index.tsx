"use client";

import type { ThemeId } from "@/lib/themes";
import * as React from "react";
import { DashboardThemeContext, type UiMode } from "./context";
import { LS_DARK, LS_LIGHT, LS_MODE, MEDIA, applyToDom, disableTransitions, readStorage } from "./utils";

export type DashboardThemeProviderProps = React.PropsWithChildren;

export const DashboardThemeProvider: React.FC<DashboardThemeProviderProps> = (props) => {
  const { children } = props;

  //* State
  const [mode, setModeState] = React.useState<UiMode>(() => readStorage(LS_MODE, "system"));
  const [preferredLight, setPrefLightState] = React.useState<ThemeId>(() => readStorage(LS_LIGHT, "stateroom"));
  const [preferredDark, setPrefDarkState] = React.useState<ThemeId>(() => readStorage(LS_DARK, "dark-depths"));
  const [systemDark, setSystemDark] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MEDIA).matches : true,
  );

  //* Variables
  // Derived values
  const isDark = mode === "dark" || (mode === "system" && systemDark);
  const resolvedTheme: ThemeId = isDark ? preferredDark : preferredLight;

  //* Handlers
  // Setters that persist to localStorage
  const setMode = React.useCallback((m: UiMode) => {
    localStorage.setItem(LS_MODE, m);
    setModeState(m);
  }, []);

  const setPreferredLight = React.useCallback((id: ThemeId) => {
    localStorage.setItem(LS_LIGHT, id);
    setPrefLightState(id);
  }, []);

  const setPreferredDark = React.useCallback((id: ThemeId) => {
    localStorage.setItem(LS_DARK, id);
    setPrefDarkState(id);
  }, []);

  // eslint-disable-next-line november-sierra/react-style-guide -- context value memo depends on handler callbacks above
  const value = React.useMemo(
    () => ({
      isDark,
      mode,
      preferredDark,
      preferredLight,
      resolvedTheme,
      setMode,
      setPreferredDark,
      setPreferredLight,
    }),
    [isDark, mode, preferredDark, preferredLight, resolvedTheme, setMode, setPreferredDark, setPreferredLight],
  );

  //* Effects
  // Listen for OS preference changes
  React.useEffect(() => {
    const mql = window.matchMedia(MEDIA);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Apply to DOM on any change
  React.useEffect(() => {
    disableTransitions();
    applyToDom(resolvedTheme);
  }, [resolvedTheme]);

  return <DashboardThemeContext.Provider value={value}>{children}</DashboardThemeContext.Provider>;
};
