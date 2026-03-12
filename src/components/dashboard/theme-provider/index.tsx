"use client";

import * as React from "react";
import { DashboardThemeContext, type ThemeContextValue } from "./context";

export function useDashboardTheme(): ThemeContextValue {
  return React.useContext(DashboardThemeContext);
}

type Theme = "dark" | "light";

export type DashboardThemeProviderProps = React.PropsWithChildren;

export const DashboardThemeProvider: React.FC<DashboardThemeProviderProps> = (props) => {
  const { children } = props;

  //* State
  const [theme, setTheme] = React.useState<Theme>("light");

  //* Handlers
  const toggle = React.useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  //* Effects
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches != null ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => setTheme(e.matches != null ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply .dark to <html> so portaled content (modals, dropdowns) inherits the theme
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <DashboardThemeContext.Provider value={{ theme, toggle }}>{children}</DashboardThemeContext.Provider>;
};
