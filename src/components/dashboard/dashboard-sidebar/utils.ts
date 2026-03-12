import { BarChart3, Link2, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", icon: Link2, labelKey: "links" },
  { href: "/dashboard/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/dashboard/settings", icon: Settings, labelKey: "settings" },
] as const;
