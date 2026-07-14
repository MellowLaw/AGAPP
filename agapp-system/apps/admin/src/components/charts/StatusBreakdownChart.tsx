'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STATUS_COLORS } from '@/components/map/markers';
import { buildTooltipContent } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';

const STATUS_ORDER = Object.keys(STATUS_COLORS);

export interface StatusBreakdownDatum {
  name: string;
  [status: string]: number | string;
}

interface StatusBreakdownChartProps {
  data: StatusBreakdownDatum[];
}

export const StatusBreakdownChart: React.FC<StatusBreakdownChartProps> = ({ data }) => {
  const legendItems = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        key: status,
        label: status,
        color: STATUS_COLORS[status],
        shape: 'rect' as const,
      })),
    []
  );

  const total = useMemo(
    () => data.reduce((sum, d) => sum + STATUS_ORDER.reduce((s, key) => s + (Number(d[key]) || 0), 0), 0),
    [data]
  );

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-text-muted bg-surface-alt/30 rounded-2xl">
        No reports yet to break down by status.
      </div>
    );
  }

  return (
    <div>
      <ChartLegend items={legendItems} className="mb-4" />
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 32 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="var(--border-theme)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-theme)' }}
            tickLine={false}
            angle={-18}
            textAnchor="end"
            height={56}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-alt)' }}
            content={buildTooltipContent((v) => Number(v).toLocaleString())}
          />
          {STATUS_ORDER.map((status, i) => (
            <Bar
              key={status}
              dataKey={status}
              name={status}
              stackId="status"
              fill={STATUS_COLORS[status]}
              stroke="var(--surface)"
              strokeWidth={2}
              maxBarSize={44}
              radius={i === STATUS_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
