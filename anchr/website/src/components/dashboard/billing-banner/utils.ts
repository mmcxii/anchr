import type { SessionUser } from "@/lib/auth";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { isProUser } from "@/lib/tier";
import { AlertTriangle, CreditCard, Timer } from "lucide-react";

export type BannerVariant = "domain-removed" | "payment-failed" | "referral-expiring";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveVariant(user: SessionUser): null | BannerVariant {
  if (user.paymentFailedAt != null && user.tier === "pro") {
    return "payment-failed";
  }

  if (user.domainRemovedAt != null) {
    return "domain-removed";
  }

  if (
    isProUser(user) &&
    user.proExpiresAt != null &&
    user.stripeSubscriptionId == null &&
    user.proExpiresAt.getTime() - Date.now() < SEVEN_DAYS_MS
  ) {
    return "referral-expiring";
  }

  return null;
}

type TFn = (key: TranslationKey, opts?: Record<string, unknown>) => string;

export type VariantConfig = {
  classes: string;
  icon: typeof AlertTriangle;
  iconClasses: string;
  getMessage: (t: TFn, user: SessionUser) => string;
};

export const VARIANT_CONFIG: Record<BannerVariant, VariantConfig> = {
  "domain-removed": {
    classes:
      "border-amber-500/30 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200",
    icon: AlertTriangle,
    iconClasses: "text-amber-600 dark:text-amber-400",
    getMessage: (t) => t("yourCustomDomainWasRemovedBecauseYourProSubscriptionEndedUpgradeToReconnectIt"),
  },
  "payment-failed": {
    classes: "border-red-500/30 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200",
    icon: CreditCard,
    iconClasses: "text-red-600 dark:text-red-400",
    getMessage: (t) => t("yourLastPaymentFailedUpdateYourPaymentMethodToKeepPro"),
  },
  "referral-expiring": {
    classes: "border-primary/30 bg-primary/5 text-foreground",
    icon: Timer,
    iconClasses: "text-primary",
    getMessage: (t, user) => {
      const days =
        user.proExpiresAt != null
          ? Math.max(0, Math.ceil((user.proExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : 0;
      return t("yourProAccessExpiresIn{{days}}DaysUpgradeToKeepYourFeatures", { days });
    },
  },
};
