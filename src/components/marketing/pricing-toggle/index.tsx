"use client";

import { useState } from "react";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type Interval = "annual" | "monthly";

const cardBase =
  "relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";
const cardStyle: React.CSSProperties = {
  background: `var(--m-card-bg)`,
  border: `1px solid rgb(var(--m-muted) / 0.15)`,
};
const accentBar = <div className="absolute inset-x-0 top-0 h-px" style={{ background: `var(--m-accent-gradient)` }} />;

const FREE_FEATURES = ["upTo5Links", "anchrToUsernameUrl", "basicAnalytics", "fourThemes"] as const;

const PRO_FEATURES = [
  "unlimitedLinks",
  "advancedAnalytics",
  "customDomains",
  "fullThemeCustomization",
  "prioritySupport",
] as const;

const FeatureItem: React.FC<{ label: string }> = ({ label }) => (
  <li className="flex items-center gap-3">
    <Check className="size-4 shrink-0" style={{ color: `rgb(var(--m-accent))` }} />
    <span style={{ color: `rgb(var(--m-muted) / 0.7)` }}>{label}</span>
  </li>
);

export const PricingCards: React.FC = () => {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<Interval>("monthly");

  const pill = (value: Interval, label: string) => {
    const active = interval === value;
    return (
      <button
        className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
        onClick={() => setInterval(value)}
        style={{
          background: active ? `rgb(var(--m-accent))` : `rgb(var(--m-muted) / 0.1)`,
          color: active ? `var(--m-page-bg)` : `rgb(var(--m-muted) / 0.5)`,
        }}
        type="button"
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {pill("monthly", t("monthly"))}
          {pill("annual", t("annual"))}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity ${interval === "annual" ? "opacity-100" : "opacity-0"}`}
          style={{
            background: `rgb(var(--m-accent) / 0.12)`,
            color: `rgb(var(--m-accent))`,
          }}
        >
          {t("save$24")}
        </span>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* Free card */}
        <div className={`${cardBase} p-8`} style={cardStyle}>
          {accentBar}
          <h3 className="mb-4 text-xl font-bold">{t("free")}</h3>
          <p className="mb-6 text-sm" style={{ color: `rgb(var(--m-muted) / 0.5)` }}>
            {t("youAreJustTestingTheWaters")}
          </p>
          <div className="mb-2 text-4xl font-bold">$0</div>
          <p className="mb-8 text-sm" style={{ color: `rgb(var(--m-muted) / 0.5)` }}>
            {t("freeForever")}
          </p>
          <ul className="flex flex-col gap-3">
            {FREE_FEATURES.map((key) => (
              <FeatureItem key={key} label={t(key)} />
            ))}
          </ul>
        </div>

        {/* Pro card */}
        <div
          className={`${cardBase} p-8`}
          style={{
            background: `var(--m-card-bg)`,
            border: `2px solid rgb(var(--m-accent))`,
          }}
        >
          {accentBar}
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-xl font-bold">{t("pro")}</h3>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: `rgb(var(--m-accent) / 0.12)`,
                color: `rgb(var(--m-accent))`,
              }}
            >
              {t("mostPopular")}
            </span>
          </div>
          <p className="mb-6 text-sm" style={{ color: `rgb(var(--m-muted) / 0.5)` }}>
            {t("youAreReadyToChartYourOwnCourse")}
          </p>
          <div className="mb-2 text-4xl font-bold">{interval === "monthly" ? t("$7Mo") : t("$5Mo")}</div>
          <p
            className={`mb-8 text-sm ${interval === "annual" ? "" : "invisible"}`}
            style={{ color: `rgb(var(--m-muted) / 0.5)` }}
          >
            {t("$60BilledAnnually")}
          </p>
          <p className="mb-4 text-sm font-medium" style={{ color: `rgb(var(--m-muted) / 0.5)` }}>
            {t("everythingInFreePlus")}
          </p>
          <ul className="flex flex-col gap-3">
            {PRO_FEATURES.map((key) => (
              <FeatureItem key={key} label={t(key)} />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
