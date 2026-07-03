/**
 * Real average turnaround time, computed from `updated_at - created_at` on
 * rows that reached a terminal state (Resolved reports, Released service
 * requests). `updated_at` is auto-stamped by a DB trigger on every UPDATE
 * (see supabase/schema.sql — touch_updated_at), so this reflects the actual
 * time-to-resolution instead of a fixed placeholder.
 */

interface TimedRow {
  status: string;
  created_at: string;
  updated_at: string;
}

const TERMINAL_REPORT_STATUS = 'Resolved';
const TERMINAL_REQUEST_STATUS = 'Released';

function avgDays(rows: TimedRow[], terminalStatus: string): number[] {
  return rows
    .filter((r) => r.status === terminalStatus && r.created_at && r.updated_at)
    .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
    .filter((d) => d >= 0);
}

/** Formats to "X.X days", or "No data yet" if nothing has been resolved yet. */
export function formatAvgTurnaround(reports: TimedRow[], requests: TimedRow[]): string {
  const durations = [
    ...avgDays(reports, TERMINAL_REPORT_STATUS),
    ...avgDays(requests, TERMINAL_REQUEST_STATUS),
  ];
  if (durations.length === 0) return 'No data yet';
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  return `${avg.toFixed(1)} days`;
}
