'use client';

// Stats overview shell — metric cards and an empty chart.
// This is intentionally a placeholder: live data lands via the seeded ADM-003
// task once a payments/analytics pack is present (e.g. payments-stripe +
// analytics-posthog). The founder wires real queries with full context of
// whichever packs are installed.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

// Placeholder chart config (wire me: populate from your analytics pack)
const chartConfig = {
  pageViews: { label: 'Page views', color: 'hsl(var(--chart-1))' },
};

// Placeholder chart data — replace with real aggregation query (ADM-003)
/* wire me: fetch from your analytics/db instead of this stub */
const placeholderChartData: { date: string; pageViews: number }[] = [];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Overview</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* wire me: replace placeholder values with real DB/payments queries (ADM-003) */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">—</p>
            {/* wire me: COUNT(*) from users table */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Paying
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">—</p>
            {/* wire me: COUNT(*) where subscription is active (requires payments pack) */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">—</p>
            {/* wire me: SUM(plan_price) for active subscriptions (requires payments pack) */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Page views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">—</p>
            {/* wire me: query your analytics provider (requires analytics pack) */}
          </CardContent>
        </Card>
      </div>

      {/* Trend chart — empty shell */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Page views over time</CardTitle>
          <p className="text-xs text-muted-foreground">
            Shell only — wire real data via seeded task ADM-003 once an analytics pack is
            installed.
          </p>
        </CardHeader>
        <CardContent>
          {/* wire me: replace placeholderChartData with a server-side aggregation query */}
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <AreaChart data={placeholderChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={32} />
              <Area
                type="monotone"
                dataKey="pageViews"
                stroke="var(--color-pageViews)"
                fill="var(--color-pageViews)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ChartContainer>
          {placeholderChartData.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No data yet — wire metrics in ADM-003.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
