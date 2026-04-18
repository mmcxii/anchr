import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart";
import { EmptyState } from "@/components/dashboard/analytics/empty-state";
import { type LinkPerformanceRow, LinkPerformanceTable } from "@/components/dashboard/analytics/link-performance-table";
import { MetricsStrip } from "@/components/dashboard/analytics/metrics-strip";
import { requireUser } from "@/lib/auth";
import {
  type DateRange,
  getAnalyticsSummary,
  getClickHistory,
  getPerLinkSparklines,
  getPerLinkTrends,
  getPerShortLinkSparklines,
  getPerShortLinkTrends,
  getPreviousPeriodClicks,
  getTopLinks,
  getTopShortLinks,
} from "@/lib/db/queries/analytics";
import { initTranslations } from "@/lib/i18n/server";
import { isProUser } from "@/lib/tier";
import { computeTrendPercent, fillDateGaps } from "@/lib/utils/analytics";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Analytics",
};

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

const VALID_RANGES = new Set<DateRange>(["7d", "30d", "all"]);
const FREE_RANGES = new Set<DateRange>(["7d"]);

const AnalyticsPage: React.FC<AnalyticsPageProps> = async (props) => {
  const { searchParams } = props;
  const user = await requireUser();
  const { t } = await initTranslations();
  const params = await searchParams;
  const isPro = isProUser(user);
  const allowedRanges = isPro ? VALID_RANGES : FREE_RANGES;
  const range: DateRange = allowedRanges.has(params.range as DateRange) ? (params.range as DateRange) : "7d";
  const isAllTime = range === "all";

  const [
    summary,
    clickHistory,
    topLinks,
    previousPeriod,
    sparklineRows,
    perLinkTrends,
    topShortLinks,
    shortLinkSparklineRows,
    perShortLinkTrends,
  ] = await Promise.all([
    getAnalyticsSummary(user.id, range),
    getClickHistory(user.id, range),
    getTopLinks(user.id, range),
    isAllTime ? Promise.resolve({ totalClicks: 0 }) : getPreviousPeriodClicks(user.id, range),
    getPerLinkSparklines(user.id),
    isAllTime ? Promise.resolve([]) : getPerLinkTrends(user.id, range),
    getTopShortLinks(user.id, range),
    getPerShortLinkSparklines(user.id),
    isAllTime ? Promise.resolve([]) : getPerShortLinkTrends(user.id, range),
  ]);

  if (summary.totalClicks === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">{t("analytics")}</h1>
        <EmptyState />
      </div>
    );
  }

  const overallTrend = isAllTime ? null : computeTrendPercent(summary.totalClicks, previousPeriod.totalClicks);

  const sparklineMap = new Map<string, { clicks: number; date: string }[]>();
  for (const row of sparklineRows) {
    if (row.linkId == null) {
      continue;
    }
    const existing = sparklineMap.get(row.linkId);
    if (existing != null) {
      existing.push({ clicks: row.clicks, date: row.date });
    } else {
      sparklineMap.set(row.linkId, [{ clicks: row.clicks, date: row.date }]);
    }
  }

  const trendMap = new Map<string, number>();
  for (const row of perLinkTrends) {
    if (row.linkId == null) {
      continue;
    }
    trendMap.set(row.linkId, computeTrendPercent(Number(row.clicks), Number(row.previousClicks)));
  }

  const linkPerformance: LinkPerformanceRow[] = topLinks.map((link) => ({
    clicks: link.clicks,
    linkId: link.linkId,
    slug: link.slug,
    sparklineData: fillDateGaps(sparklineMap.get(link.linkId) ?? [], 7),
    title: link.title,
    trendPercent: isAllTime ? null : (trendMap.get(link.linkId) ?? null),
  }));

  const shortLinkSparklineMap = new Map<string, { clicks: number; date: string }[]>();
  for (const row of shortLinkSparklineRows) {
    if (row.shortLinkId == null) {
      continue;
    }
    const existing = shortLinkSparklineMap.get(row.shortLinkId);
    if (existing != null) {
      existing.push({ clicks: row.clicks, date: row.date });
    } else {
      shortLinkSparklineMap.set(row.shortLinkId, [{ clicks: row.clicks, date: row.date }]);
    }
  }

  const shortLinkTrendMap = new Map<string, number>();
  for (const row of perShortLinkTrends) {
    if (row.shortLinkId == null) {
      continue;
    }
    shortLinkTrendMap.set(row.shortLinkId, computeTrendPercent(Number(row.clicks), Number(row.previousClicks)));
  }

  const shortLinkPerformance: LinkPerformanceRow[] = topShortLinks.map((link) => ({
    clicks: link.clicks,
    linkId: link.shortLinkId,
    slug: link.slug,
    sparklineData: fillDateGaps(shortLinkSparklineMap.get(link.shortLinkId) ?? [], 7),
    title: link.customSlug ?? link.slug,
    trendPercent: isAllTime ? null : (shortLinkTrendMap.get(link.shortLinkId) ?? null),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("analytics")}</h1>

      <div className="flex flex-col gap-6">
        <MetricsStrip
          topCountry={summary.topCountry}
          topLinkTitle={summary.topLinkTitle}
          totalClicks={summary.totalClicks}
          trendPercent={overallTrend}
        />

        <ClicksChart data={clickHistory} isPro={isPro} />

        {linkPerformance.length > 0 && <LinkPerformanceTable heading={t("linkPerformance")} links={linkPerformance} />}

        {shortLinkPerformance.length > 0 && (
          <LinkPerformanceTable heading={t("shortLinkPerformance")} links={shortLinkPerformance} />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
