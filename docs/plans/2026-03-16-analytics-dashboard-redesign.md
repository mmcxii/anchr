# Analytics Dashboard Redesign

## Summary

Redesign the analytics dashboard (`/dashboard/analytics`) from a generic card-based layout to a focused, typography-driven page with three sections: a chrome-free metrics strip, the existing hero area chart, and a link performance table with per-link sparklines and trend percentages.

## Current State

- 3 summary cards (total clicks, top link, top country) in Card wrappers with icons
- Clicks-over-time area chart (Recharts) — **keeping this**
- Device breakdown donut/pie chart — **removing**
- Top links table with progress bars — **replacing**
- Location list (country + count) — **removing**
- Layout uses 2-column grids with 2/3 + 1/3 splits

## Design

### 1. Metrics Strip

A single horizontal row of 3 stats. No Card wrappers, no icons — just typography.

| Stat         | Primary           | Secondary                                         |
| ------------ | ----------------- | ------------------------------------------------- |
| Total clicks | Large bold number | Trend % vs previous period (green/red with arrow) |
| Top link     | Link title        | —                                                 |
| Top country  | Country name      | —                                                 |

Layout: `grid-cols-3` on sm+, stacked on mobile. Each stat is a label (muted, small) below a value (bold, large).

The trend comparison uses the same date range length for the previous period (e.g., "Last 7 days" compares to the 7 days before that). For "All time" range, no trend is shown.

### 2. Hero Area Chart

The existing clicks-over-time Recharts area chart, unchanged except:

- Date range selector (`DateRangeSelect`) moves into the chart card header (right-aligned next to "Clicks over time" title), removing it from the page-level header.

### 3. Link Performance Table

Replaces the top links table, device chart, and location list with a single consolidated table.

**Columns:**

| Column    | Content                                                                   |
| --------- | ------------------------------------------------------------------------- |
| Rank      | Row number (1, 2, 3...)                                                   |
| Link      | Link title                                                                |
| Sparkline | 7-day inline area chart (tiny, ~80x24px) showing that link's daily clicks |
| Clicks    | Total click count for the period                                          |
| Trend     | % change vs previous equivalent period, with colored arrow                |

- Sorted by clicks descending
- Shows all links (not just top 10)
- Sparklines always show 7 days of data regardless of the selected date range (they represent recent trajectory)
- Trend % uses same previous-period logic as the metrics strip
- Green text + up arrow for positive trends, red + down arrow for negative, muted for 0%

### Components Removed

- `DeviceChart` (pie chart) — device data dropped entirely
- `LocationList` — geographic data deferred to ANC-98 (globe visualization)
- `SummaryCards` — replaced by chrome-free metrics strip
- Card wrappers on summary stats

### Components Modified

- `ClicksChart` — absorb DateRangeSelect into its header
- `DateRangeSelect` — no structural changes, just repositioned

### Components Added

- `MetricsStrip` — chrome-free stat row
- `LinkPerformanceTable` — table with sparklines and trends
- `LinkSparkline` — tiny inline Recharts area chart for table cells

## Data Requirements

### New Queries Needed

1. **Previous period summary** — total clicks for the equivalent previous period (for trend calculation)
2. **Per-link click history** — daily click counts per link for the last 7 days (for sparklines)
3. **Per-link previous period clicks** — click count per link for the previous equivalent period (for per-link trends)

### Existing Queries Retained

- `getAnalyticsSummary` — still provides totalClicks, topLinkTitle, topCountry
- `getClickHistory` — still feeds the hero chart
- `getTopLinks` — base for the table (may need modification to return all links instead of top 10)

### Queries Removed

- `getDeviceStats` — no longer needed
