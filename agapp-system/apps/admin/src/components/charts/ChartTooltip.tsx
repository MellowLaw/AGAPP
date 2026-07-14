'use client';

import React from 'react';

/**
 * Shared Recharts tooltip content, styled with this app's theme tokens so it
 * reads correctly in both light and dark mode (see globals.css / tailwind.config.ts).
 *
 * Per the dataviz method: values lead (bold, high-contrast), series names
 * follow (secondary ink); each row is keyed with a short line-stroke of the
 * series color rather than a filled box ("line keys, not boxes").
 */

export interface ChartTooltipRow {
  key: string;
  label: string;
  value: React.ReactNode;
  color: string;
}

interface ChartTooltipShellProps {
  title?: string;
  rows: ChartTooltipRow[];
}

export const ChartTooltipShell: React.FC<ChartTooltipShellProps> = ({ title, rows }) => {
  if (rows.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-theme bg-surface px-3.5 py-3 shadow-lg"
      style={{ minWidth: 160 }}
    >
      {title && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[12px] text-text-muted">
              <span
                aria-hidden
                className="inline-block h-[2px] w-3 rounded-full shrink-0"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="text-[13px] font-semibold font-mono text-text-primary tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Recharts `<Tooltip content={...}>` adapter — builds rows from the default payload shape. */
export function buildTooltipContent(
  valueFormatter: (value: any, dataKey: string) => React.ReactNode = (v) => v,
  titleFormatter?: (label: string) => string
) {
  const TooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const rows: ChartTooltipRow[] = payload.map((entry: any, i: number) => ({
      key: `${entry.dataKey ?? entry.name}-${i}`,
      label: entry.name ?? entry.dataKey,
      value: valueFormatter(entry.value, entry.dataKey ?? entry.name),
      color: entry.color ?? entry.stroke ?? entry.fill ?? 'var(--accent)',
    }));
    return (
      <ChartTooltipShell title={titleFormatter ? titleFormatter(label) : label} rows={rows} />
    );
  };
  TooltipContent.displayName = 'ChartTooltipContent';
  return TooltipContent;
}
