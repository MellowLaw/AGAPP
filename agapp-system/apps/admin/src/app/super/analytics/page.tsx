'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search } from '@/components/ui/Search';
import { Pagination } from '@/components/ui/Pagination';
import { supabase } from '@/lib/supabase';
import { TrendLineChart, type TrendDatum } from '@/components/charts/TrendLineChart';

interface Row { lgu: string; month: string; reports: number; requests: number; }

export default function SuperAnalyticsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<Row[]>([]);
  const [trend, setTrend] = useState<TrendDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setLoadError(null);

      const [{ data: lgus, error: lguError }, { data: reports, error: reportsError }, { data: services, error: servicesError }] = await Promise.all([
        supabase
          .from('lgus')
          .select('id, name'),
        supabase
          .from('reports')
          .select('lgu_id, created_at'),
        supabase
          .from('service_requests')
          .select('lgu_id, created_at'),
      ]);

      if (lguError || reportsError || servicesError) {
        console.error('Error loading analytics data', lguError || reportsError || servicesError);
        setLoadError((lguError || reportsError || servicesError)?.message || 'Failed to load analytics');
        setLoading(false);
        return;
      }

      const lguNameMap = new Map<string, string>();
      (lgus || []).forEach((l: any) => {
        lguNameMap.set(l.id, l.name);
      });

      const bucket: Record<string, Row> = {};

      const monthKey = (d: Date) => {
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${month} ${year}`;
      };

      (reports || []).forEach((r: any) => {
        if (!r.created_at || !r.lgu_id) return;
        const d = new Date(r.created_at);
        const key = `${r.lgu_id}|${monthKey(d)}`;
        if (!bucket[key]) {
          bucket[key] = {
            lgu: lguNameMap.get(r.lgu_id) || r.lgu_id,
            month: monthKey(d),
            reports: 0,
            requests: 0,
          };
        }
        bucket[key].reports++;
      });

      (services || []).forEach((s: any) => {
        if (!s.created_at || !s.lgu_id) return;
        const d = new Date(s.created_at);
        const key = `${s.lgu_id}|${monthKey(d)}`;
        if (!bucket[key]) {
          bucket[key] = {
            lgu: lguNameMap.get(s.lgu_id) || s.lgu_id,
            month: monthKey(d),
            reports: 0,
            requests: 0,
          };
        }
        bucket[key].requests++;
      });

      const aggregated = Object.values(bucket).sort((a, b) => {
        if (a.lgu === b.lgu) {
          return a.month.localeCompare(b.month);
        }
        return a.lgu.localeCompare(b.lgu);
      });

      setRows(aggregated);

      // Monthly series summed across ALL LGUs (reusing the same reports/
      // services rows already fetched above — no extra query), sorted
      // chronologically via a sortable YYYY-MM key rather than the
      // locale month label used for the per-LGU table above.
      const monthSortKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const trendBucket: Record<string, { label: string; reports: number; requests: number }> = {};

      (reports || []).forEach((r: any) => {
        if (!r.created_at) return;
        const d = new Date(r.created_at);
        const key = monthSortKey(d);
        if (!trendBucket[key]) trendBucket[key] = { label: monthLabel(d), reports: 0, requests: 0 };
        trendBucket[key].reports++;
      });

      (services || []).forEach((s: any) => {
        if (!s.created_at) return;
        const d = new Date(s.created_at);
        const key = monthSortKey(d);
        if (!trendBucket[key]) trendBucket[key] = { label: monthLabel(d), reports: 0, requests: 0 };
        trendBucket[key].requests++;
      });

      const trendSeries = Object.keys(trendBucket)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({
          month: trendBucket[key].label,
          reports: trendBucket[key].reports,
          requests: trendBucket[key].requests,
        }));

      setTrend(trendSeries);
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const filtered = useMemo(() => rows.filter(r =>
    (r.lgu + r.month).toLowerCase().includes(q.toLowerCase())
  ), [q, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const exportCsv = () => {
    const header = 'LGU,Month,Reports,Requests\n';
    const rows = filtered.map(r => `${r.lgu},${r.month},${r.reports},${r.requests}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="super-admin" title="Analytics">
      <Card className="mb-6">
        <CardHeader
          title="Reports vs. Requests Over Time"
          subtitle="Monthly totals summed across all LGUs"
        />
        {loading ? (
          <div className="px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-xl">Loading trend…</div>
        ) : (
          <TrendLineChart data={trend} />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Cross-LGU Metrics"
          action={
            <div className="flex items-center gap-2">
              <Search value={q} onChange={setQ} className="w-64" placeholder="Search LGU or month..." />
              <Button variant="secondary" size="sm" onClick={exportCsv}>Export CSV</Button>
            </div>
          }
        />

        {loading && (
          <div className="mb-3 px-4 py-2 text-sm text-text-muted bg-surface-alt rounded-xl">Loading analytics…</div>
        )}
        {loadError && !loading && (
          <div className="mb-3 px-4 py-2 text-sm text-accent bg-accent-soft rounded-xl">Failed to load analytics: {loadError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">LGU</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Month</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Reports</th>
                <th className="text-left pb-2 px-4 text-xs font-semibold text-text-faint uppercase tracking-wider">Requests</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => (
                <tr key={i} className="bg-surface-alt hover:bg-accent-soft transition-colors">
                  <td className="py-3 px-4 rounded-l-xl text-sm text-text-primary">{r.lgu}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{r.month}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-muted">{r.reports}</td>
                  <td className="py-3 px-4 rounded-r-xl text-sm font-mono text-text-muted">{r.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} itemsPerPage={pageSize} />
      </Card>
    </DashboardLayout>
  );
}
