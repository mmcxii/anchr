"use client";

import { NAV_LINKS } from "@/components/marketing/site-header/constants";
import { cn } from "@/lib/utils";
import { Anchor } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const MobileMenu: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  //* Lock body scroll when menu is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  //* Handlers
  const handleToggle = React.useCallback(() => {
    setOpen((o) => !o);
  }, []);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {/* Hamburger / X toggle button */}
      <button
        aria-expanded={open}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="relative z-50 flex size-9 items-center justify-center rounded-md sm:hidden"
        onClick={handleToggle}
        type="button"
      >
        <div className="flex w-5 flex-col items-center gap-[5px]">
          <span
            className={cn("block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-in-out", {
              "translate-y-[6.5px] rotate-45": open,
            })}
          />
          <span
            className={cn("block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-in-out", {
              "scale-x-0 opacity-0": open,
            })}
          />
          <span
            className={cn("block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-in-out", {
              "-translate-y-[6.5px] -rotate-45": open,
            })}
          />
        </div>
      </button>

      {/* Full-screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-(--m-page-bg) transition-all duration-300 ease-in-out sm:hidden",
          { "invisible opacity-0": !open, "visible opacity-100": open },
        )}
      >
        {/* Nav links — centered vertically */}
        <nav className="flex flex-1 flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              className={cn(
                "text-2xl font-semibold tracking-tight transition-all duration-300 ease-out",
                "m-muted-70 hover:text-[rgb(var(--m-text))]",
                { "translate-y-0 opacity-100": open, "translate-y-4 opacity-0": !open },
              )}
              href={link.href}
              key={link.href}
              onClick={handleClose}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-12 items-center rounded-lg px-8 text-lg font-semibold transition-all duration-300 ease-out",
              { "translate-y-0 opacity-100": open, "translate-y-4 opacity-0": !open },
            )}
            href="/sign-up"
            onClick={handleClose}
          >
            {t("signUp")}
          </Link>
        </nav>

        {/* Bottom branding */}
        <div className="flex items-center justify-center pb-10">
          <Anchor className="m-muted-25 size-5" strokeWidth={1.5} />
        </div>
      </div>
    </>
  );
};
