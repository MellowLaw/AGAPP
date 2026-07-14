'use client';

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildTooltipContent } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';

export interface TrendDatum {
  month: string;
  reports: number;
  requests: number;
}

interface TrendLineChartProps {
  data: TrendDatum[];
}

// Secondary series color — kept local to this component (not a shared theme
// token) so the primary/brand --accent color is reserved for the "Reports"
// series per design direction. Set via a scoped CSS custom property so it
// still swaps cleanly between light and dark.
const SECONDARY_VARS = '[--series-secondary:#2a78d6] dark:[--series-secondary:#3987e5]';

function makeEndLabel(color: string, lastIndex: number) {
  const EndLabel = (props: any) => {
    const { x, y, index, value } = props;
    if (index !== lastIndex || value == null) return null;
    return (
      <text x={x + 8} y={y} dy={4} fill={color} fontSize={12} fontWeight={600}>
        {Number(value).toLocaleString()}
      </text>
    );
  };
  EndLabel.displayName = 'TrendEndLabel';
  return EndLabel;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ data }) => {
  const lastIndex = data.length - 1;

  const legendItems = useMemo(
    () => [
      { key: 'reports', label: 'Reports', color: 'var(--accent)', shape: 'line' as const },
      { key: 'requests', label: 'Service Requests', color: 'var(--series-secondary)', shape: 'line' as const },
    ],
    []
  );

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-text-muted bg-surface-alt/30 rounded-2xl">
        No monthly activity to chart yet.
      </div>
    );
  }

  return (
    <div className={SECONDARY_VARS}>
      <ChartLegend items={legendItems} className="mb-4" />
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border-theme)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-theme)' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
            content={buildTooltipContent((v) => Number(v).toLocaleString())}
          />
          <Line
            type="monotone"
            dataKey="reports"
            name="Reports"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            label={makeEndLabel('var(--accent)', lastIndex) as any}
          />
          <Line
            type="monotone"
            dataKey="requests"
            name="Service Requests"
            stroke="var(--series-secondary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            label={makeEndLabel('var(--series-secondary)', lastIndex) as any}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
