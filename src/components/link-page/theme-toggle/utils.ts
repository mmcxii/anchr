import type { PageMode } from "@/components/link-page/theme-provider/context";
import { Monitor, Moon, Sun } from "lucide-react";

export const MODES: { icon: typeof Monitor; labelKey: string; value: PageMode }[] = [
  { icon: Monitor, labelKey: "switchToSystemTheme", value: "system" },
  { icon: Sun, labelKey: "switchToLightTheme", value: "light" },
  { icon: Moon, labelKey: "switchToDarkTheme", value: "dark" },
];
