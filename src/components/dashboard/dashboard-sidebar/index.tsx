"use client";

import { useDashboardTheme } from "@/components/dashboard/theme-provider";
import { DashboardThemeToggle } from "@/components/dashboard/theme-toggle";
import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "./utils";

export type DashboardSidebarProps = {
  user: SessionUser;
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = (props) => {
  const { user } = props;

  //* State
  const { t } = useTranslation();
  const { theme } = useDashboardTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  //* Variables
  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();
  const logoAccent = theme === "dark" ? "212 184 150" : "10 23 41";
  const logoCardBg = theme === "dark" ? "rgba(30, 45, 66, 0.4)" : "rgba(255, 252, 245, 0.7)";
  const dividerColor = theme === "dark" ? "bg-brand-gold/25" : "bg-brand-deep-navy/18";
  const wordmarkColor = theme === "dark" ? "text-brand-gold" : "text-brand-deep-navy";

  //* Handlers
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile header */}
      <header className="bg-sidebar border-sidebar-border flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/dashboard" onClick={closeMobile}>
          <SiteBrandmark
            dividerClassName={dividerColor}
            logoProps={{ accent: logoAccent, cardBg: logoCardBg }}
            size="xs"
            wordmarkClassName={wordmarkColor}
          />
        </Link>
        <button
          aria-label={mobileOpen != null ? t("closeMenu") : t("openMenu")}
          className="text-sidebar-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
        >
          {mobileOpen != null ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen != null && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          onKeyDown={(e) => e.key === "Escape" && closeMobile()}
          role="button"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0",
          { "-translate-x-full": !mobileOpen, "translate-x-0": mobileOpen },
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center px-4">
          <Link className="inline-flex items-center" href="/dashboard" onClick={closeMobile}>
            <SiteBrandmark
              dividerClassName={dividerColor}
              logoProps={{ accent: logoAccent, cardBg: logoCardBg }}
              size="xs"
              wordmarkClassName={wordmarkColor}
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      {
                        "bg-sidebar-accent text-sidebar-accent-foreground": isActive,
                        "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground":
                          !isActive,
                      },
                    )}
                    href={item.href}
                    onClick={closeMobile}
                  >
                    <item.icon className="size-4" />
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User menu */}
        <div className="border-sidebar-border border-t p-3">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-sidebar-accent flex flex-1 items-center gap-3 rounded-md px-3 py-2 outline-none">
                <Avatar size="sm">
                  {user.avatarUrl != null && (
                    <AvatarImage alt={user.displayName ?? user.username} src={user.avatarUrl} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sidebar-foreground text-sm font-medium">
                    {user.displayName ?? user.username}
                  </span>
                  <span className="text-sidebar-foreground/50 text-xs">@{user.username}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="top">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">{t("settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton>
                  <DropdownMenuItem>{t("signOut")}</DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
            <DashboardThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
};
