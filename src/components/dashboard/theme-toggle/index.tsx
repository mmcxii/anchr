"use client";

import { useDashboardTheme } from "@/components/dashboard/theme-provider";
import { Moon, Sun } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const DashboardThemeToggle: React.FC = () => {
  const { theme, toggle } = useDashboardTheme();
  const { t } = useTranslation();

  return (
    <button
      aria-label={t("toggleTheme")}
      className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-md p-2 transition-colors"
      onClick={toggle}
      type="button"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
};
