'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildTooltipContent } from './ChartTooltip';

export interface LguRankingDatum {
  id: string;
  name: string;
  reports: number;
  requests: number;
  users: number;
  /** null when the LGU has no resolved reports/requests to average yet. */
  responseTimeDays: number | null;
}

type MetricKey = 'reports' | 'requests' | 'users' | 'responseTimeDays';

const METRICS: { key: MetricKey; label: string; shortLabel: string }[] = [
  { key: 'reports', label: 'Reports', shortLabel: 'Reports' },
  { key: 'requests', label: 'Service Requests', shortLabel: 'Requests' },
  { key: 'users', label: 'Active Users', shortLabel: 'Users' },
  { key: 'responseTimeDays', label: 'Avg. Response (days)', shortLabel: 'Avg Response' },
];

function formatMetricValue(metric: MetricKey, value: number): string {
  if (metric === 'responseTimeDays') return `${value.toFixed(1)}d`;
  return value.toLocaleString();
}

interface LguRankingBarChartProps {
  data: LguRankingDatum[];
}

export const LguRankingBarChart: React.FC<LguRankingBarChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<MetricKey>('reports');

  const { chartData, omittedCount } = useMemo(() => {
    const rows = data
      .map((d) => ({ name: d.name, value: d[metric] }))
      .filter((r): r is { name: string; value: number } => typeof r.value === 'number');
    rows.sort((a, b) => b.value - a.value);
    return { chartData: rows, omittedCount: data.length - rows.length };
  }, [data, metric]);

  const height = Math.max(220, chartData.length * 44 + 32);
  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              metric === m.key
                ? 'bg-accent text-white'
                : 'bg-transparent border border-theme text-text-muted hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {m.shortLabel}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-text-muted bg-surface-alt/30 rounded-2xl">
          No data available for this metric yet.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
              barCategoryGap={14}
            >
              <CartesianGrid horizontal={false} stroke="var(--border-theme)" />
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-theme)' }}
                tickLine={false}
                allowDecimals={metric === 'responseTimeDays'}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: 'var(--text-base)', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-alt)' }}
                content={buildTooltipContent(
                  (v) => formatMetricValue(metric, v),
                  () => activeMetric.label
                )}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={((v: number | undefined) =>
                    typeof v === 'number' ? formatMetricValue(metric, v) : ''
                  ) as any}
                  style={{ fill: 'var(--text-base)', fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {metric === 'responseTimeDays' && omittedCount > 0 && (
            <p className="text-xs text-text-muted mt-2">
              {omittedCount} LGU{omittedCount === 1 ? '' : 's'} excluded — no resolved reports or requests yet.
            </p>
          )}
        </>
      )}
    </div>
  );
};
