"use client";

import * as React from "react";

type Theme = "dark" | "light";

export type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export const DashboardThemeContext = React.createContext<ThemeContextValue>({ theme: "light", toggle: () => {} });
