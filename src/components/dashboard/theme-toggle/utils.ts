import type { UiMode } from "@/components/dashboard/theme-provider/context";
import { Monitor, Moon, Sun } from "lucide-react";

export const MODE_OPTIONS: { icon: typeof Monitor; label: string; value: UiMode }[] = [
  { icon: Monitor, label: "system", value: "system" },
  { icon: Sun, label: "light", value: "light" },
  { icon: Moon, label: "dark", value: "dark" },
];
