"use client";

import { DARK_THEME_IDS, type ThemeId } from "@/lib/themes";
import * as React from "react";
import { LinkPageThemeContext, type PageMode } from "./context";
import { LS_KEY, MEDIA, readMode } from "./utils";

export type ThemeProviderProps = React.PropsWithChildren<{
  darkThemeId: ThemeId;
  lightThemeId: ThemeId;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = (props) => {
  const { children, darkThemeId, lightThemeId } = props;

  const [mode, setModeState] = React.useState<PageMode>(readMode);
  const [systemDark, setSystemDark] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MEDIA).matches : true,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(MEDIA);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const isDark = mode === "dark" || (mode === "system" && systemDark);
  const resolvedTheme: ThemeId = isDark ? darkThemeId : lightThemeId;

  const setMode = React.useCallback((m: PageMode) => {
    localStorage.setItem(LS_KEY, m);
    setModeState(m);
  }, []);

  const value = React.useMemo(() => ({ isDark, mode, setMode }), [isDark, mode, setMode]);

  return (
    <LinkPageThemeContext.Provider value={value}>
      <div
        className="lp-page-bg flex min-h-dvh flex-col"
        data-theme={resolvedTheme}
        // eslint-disable-next-line anchr/no-inline-style -- dynamic color-scheme for browser chrome
        style={{ colorScheme: DARK_THEME_IDS.has(resolvedTheme) ? "dark" : "light" }}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LinkPageThemeContext.Provider>
  );
};
