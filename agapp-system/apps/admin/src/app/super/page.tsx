'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatAvgTurnaround } from '@/lib/turnaround';
import {
  ABANDONED_REPORT_DAYS,
  STALE_REPORT_DAYS,
  STALE_REQUEST_DAYS,
  UNCOLLECTED_REQUEST_DAYS,
} from '@/lib/importantNotices';
import { ReportsMap, type ReportPin } from '@/components/map';
import { STATUS_COLORS } from '@/components/map/markers';
import { LguRankingBarChart, type LguRankingDatum } from '@/components/charts/LguRankingBarChart';
import { StatusBreakdownChart, type StatusBreakdownDatum } from '@/components/charts/StatusBreakdownChart';
import { NeedsAttentionPanel, type NeedsAttentionData } from '@/components/charts/NeedsAttentionPanel';
import { Building, Users, Warning, FileText, Plus } from '@phosphor-icons/react';

// LGUs with zero reports AND zero requests created in this window are
// flagged as inactive on the cross-LGU "Needs attention" panel.
const INACTIVE_LGU_DAYS = 14;
const daysAgo = (days: number) => Date.now() - days * 86_400_000;

const TERMINAL_REPORT_STATUS = 'Resolved';
const TERMINAL_REQUEST_STATUS = 'Released';

// Numeric twin of formatAvgTurnaround (lib/turnaround.ts) — same rows, same
// terminal statuses, but returns a raw number (or null) so it can feed the
// ranking chart instead of a display string.
function computeAvgResponseDays(reports: any[], requests: any[]): number | null {
  const durations = [
    ...reports
      .filter((r) => r.status === TERMINAL_REPORT_STATUS && r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
      .filter((d) => d >= 0),
    ...requests
      .filter((r) => r.status === TERMINAL_REQUEST_STATUS && r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
      .filter((d) => d >= 0),
  ];
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

const mapDbCategoryToLabel = (category: string): string => {
  switch (category) {
    case 'pothole':
      return 'Pothole / Road Damage';
    case 'clogged_drainage':
      return 'Drainage / Canal';
    case 'stray_animal':
      return 'Stray Pets';
    case 'damaged_pole':
      return 'Damaged Pole';
    default:
      return category || 'Other';
  }
};

// Midpoint of the Liliw–Nagcarlan corridor: the platform's pilot scope is
// these two Laguna municipalities, so the cross-LGU map defaults to a Laguna
// view (fitBounds takes over as soon as report pins load).
const LAGUNA_CENTER: [number, number] = [14.1335, 121.4265];

export default function SuperAdminDashboard() {
  const [lgus, setLgus] = useState<any[]>([]);
  const [selectedLgu, setSelectedLgu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [{ data: dbLgus }, { data: dbUsers }, { data: dbReportsData }, { data: dbRequestsData }] = await Promise.all([
          supabase.from('lgus').select('id, name, is_active, latitude, longitude'),
          supabase.from('users').select('id, role, lgu_id'),
          supabase
            .from('reports')
            .select('id, lgu_id, status, created_at, updated_at, reference_number, category, barangay, latitude, longitude, photo_url, sla_due_date'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at, updated_at'),
        ]);

        if (dbReportsData) setDbReports(dbReportsData);
        if (dbRequestsData) setDbRequests(dbRequestsData);

        if (dbLgus) {
          const mapped = dbLgus.map((lgu: any) => {
            const lguUsers = (dbUsers || []).filter(u => u.lgu_id === lgu.id).length;
            const lguOwnReports = (dbReportsData || []).filter(r => r.lgu_id === lgu.id);
            const lguOwnRequests = (dbRequestsData || []).filter(s => s.lgu_id === lgu.id);
            return {
              id: lgu.id,
              name: lgu.name,
              status: lgu.is_active ? 'active' : 'inactive',
              latitude: lgu.latitude,
              longitude: lgu.longitude,
              users: lguUsers || 0,
              reports: lguOwnReports.length,
              requests: lguOwnRequests.length,
              responseTime: formatAvgTurnaround(lguOwnReports, lguOwnRequests),
              responseTimeDays: computeAvgResponseDays(lguOwnReports, lguOwnRequests),
            };
          });
          setLgus(mapped);
        }
      } catch (err) {
        console.error('Failed to load super admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate stats based on selection
  const filteredLgus = selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus;

  const stats = useMemo(() => {
    return [
      {
        label: 'Total LGUs',
        value: selectedLgu ? '1' : filteredLgus.length.toString(),
        icon: Building
      },
      {
        label: 'Active Users',
        value: filteredLgus.reduce((sum, l) => sum + l.users, 0).toLocaleString(),
        icon: Users
      },
      {
        label: 'Reports Seeded',
        value: filteredLgus.reduce((sum, l) => sum + l.reports, 0).toString(),
        icon: Warning
      },
      {
        label: 'Service Requests',
        value: filteredLgus.reduce((sum, l) => sum + l.requests, 0).toString(),
        icon: FileText
      },
    ];
  }, [selectedLgu, filteredLgus]);

  // Chart data for the LGU ranking bars — respects the LGU filter tabs like
  // the rest of the dashboard.
  const rankingData = useMemo<LguRankingDatum[]>(
    () =>
      filteredLgus.map((l) => ({
        id: l.id,
        name: l.name,
        reports: l.reports,
        requests: l.requests,
        users: l.users,
        responseTimeDays: l.responseTimeDays,
      })),
    [filteredLgus]
  );

  // Reports-by-status per LGU, stacked using the same STATUS_COLORS the
  // reports map uses, so status colors mean the same thing everywhere.
  const statusBreakdownData = useMemo<StatusBreakdownDatum[]>(
    () =>
      filteredLgus.map((lgu) => {
        const counts: StatusBreakdownDatum = { name: lgu.name };
        Object.keys(STATUS_COLORS).forEach((status) => {
          counts[status] = 0;
        });
        dbReports
          .filter((r) => r.lgu_id === lgu.id)
          .forEach((r) => {
            const key = r.status || 'Submitted';
            counts[key] = (Number(counts[key]) || 0) + 1;
          });
        return counts;
      }),
    [dbReports, filteredLgus]
  );

  // Cross-LGU "needs attention" aggregation — same aging thresholds as the
  // per-LGU notification bell (lib/importantNotices.ts), but computed across
  // ALL LGUs from data already loaded above instead of one query per LGU.
  const needsAttention = useMemo<NeedsAttentionData>(() => {
    const now = Date.now();
    let overdueReports = 0;
    let staleReports = 0;

    dbReports
      .filter((r) => ['Submitted', 'Under Review', 'In Progress'].includes(r.status))
      .forEach((r) => {
        const overdue = !!r.sla_due_date && new Date(r.sla_due_date).getTime() < now;
        if (overdue) {
          overdueReports++;
          return; // overdue takes priority over "stale", same as the bell
        }
        const abandoned = r.status === 'Submitted' && new Date(r.created_at).getTime() < daysAgo(ABANDONED_REPORT_DAYS);
        const stale = new Date(r.updated_at).getTime() < daysAgo(STALE_REPORT_DAYS);
        if (abandoned || stale) staleReports++;
      });

    let staleRequests = 0;
    let uncollectedRequests = 0;

    dbRequests.forEach((r) => {
      if (r.status === 'Ready for Pickup') {
        if (new Date(r.updated_at).getTime() < daysAgo(UNCOLLECTED_REQUEST_DAYS)) uncollectedRequests++;
        return;
      }
      if (!['Submitted', 'Under Review'].includes(r.status)) return;
      if (new Date(r.updated_at).getTime() < daysAgo(STALE_REQUEST_DAYS)) staleRequests++;
    });

    const inactiveLgus = lgus
      .filter((lgu) => {
        const cutoff = daysAgo(INACTIVE_LGU_DAYS);
        const hasRecentReport = dbReports.some((r) => r.lgu_id === lgu.id && new Date(r.created_at).getTime() >= cutoff);
        const hasRecentRequest = dbRequests.some((r) => r.lgu_id === lgu.id && new Date(r.created_at).getTime() >= cutoff);
        return !hasRecentReport && !hasRecentRequest;
      })
      .map((lgu) => lgu.name);

    return { overdueReports, staleReports, staleRequests, uncollectedRequests, inactiveLgus };
  }, [dbReports, dbRequests, lgus]);

  // Pins for the cross-LGU map, respecting the LGU filter tabs. View-only:
  // super admin sees where every report is and its status, but takes no action.
  const reportPins = useMemo<ReportPin[]>(
    () =>
      dbReports
        .filter((r) => (selectedLgu ? r.lgu_id === selectedLgu : true))
        .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
        .map((r) => ({
          id: r.id,
          refNumber: r.reference_number || r.id,
          lat: r.latitude,
          lng: r.longitude,
          status: r.status || 'Submitted',
          category: mapDbCategoryToLabel(r.category),
          barangay: r.barangay || '',
          date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
          photoUrl: r.photo_url,
        })),
    [dbReports, selectedLgu]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedLgu) {
      const lgu = lgus.find((l) => l.id === selectedLgu);
      if (lgu?.latitude && lgu?.longitude) return [lgu.latitude, lgu.longitude];
    }
    return LAGUNA_CENTER;
  }, [selectedLgu, lgus]);

  return (
    <DashboardLayout
      role="super-admin"
      title="Dashboard Overview"
      heroKicker="MUNICIPAL CONTROL CENTER — SUPER ADMIN"
      heroTitleAccent="Agapp Portal"
    >
      {/* LGU Filter Tabs */}
      <div className="flex items-center gap-2.5 mb-8 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setSelectedLgu(null)}
          className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
            selectedLgu === null
              ? 'bg-text-primary text-bg'
              : 'bg-transparent border border-theme text-text-muted hover:border-text-muted hover:text-text-primary'
          }`}
        >
          All LGUs
        </motion.button>
        {lgus.map(lgu => (
          <motion.button
            key={lgu.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedLgu(lgu.id)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
              selectedLgu === lgu.id
                ? 'bg-text-primary text-bg'
                : 'bg-transparent border border-theme text-text-muted hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {lgu.name}
          </motion.button>
        ))}
        <Link href="/super/lgus">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 bg-transparent border border-theme rounded-full text-[13px] font-semibold text-text-primary hover:border-text-muted flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add LGU
          </motion.button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card noBorder className="rounded-[20px] min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-text-muted">{stat.label}</p>
                  <div className="p-1.5 bg-surface-alt rounded-md border border-theme">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[32px] font-mono font-bold text-text-primary tracking-tight leading-none">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Needs Attention + LGU Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-1">
          <NeedsAttentionPanel data={needsAttention} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <Card noBorder className="rounded-[20px] h-full">
            <div className="mb-1">
              <h3 className="text-lg font-bold text-text-primary">LGU Ranking</h3>
              <p className="text-xs font-serif italic text-accent mt-0.5">Compare each LGU by a metric of your choice</p>
            </div>
            <div className="mt-4">
              <LguRankingBarChart data={rankingData} />
            </div>
          </Card>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-text-primary">Reports by Status</h3>
          <p className="text-sm font-serif italic text-accent mt-1">
            {selectedLgu
              ? `Status breakdown for ${lgus.find(l => l.id === selectedLgu)?.name || 'selected LGU'}`
              : 'Status breakdown per LGU, across all tenants'}
          </p>
        </div>
        <Card noBorder className="rounded-[20px]">
          <StatusBreakdownChart data={statusBreakdownData} />
        </Card>
      </div>

      {/* Cross-LGU Reports Map */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">Reports Hotspot Map</h3>
            <p className="text-sm font-serif italic text-accent mt-1">
              {selectedLgu
                ? `Report locations for ${lgus.find(l => l.id === selectedLgu)?.name || 'selected LGU'}`
                : 'Interactive Reports Map across all LGUs'}
            </p>
          </div>
          <Badge variant="default" className="!bg-accent !text-white font-semibold px-2.5 py-1 border-0">
            View only
          </Badge>
        </div>
        {!loading && reportPins.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-text-muted bg-surface-alt/30 rounded-2xl">
            No reports with location data{selectedLgu ? ' for this LGU' : ''} yet.
          </div>
        ) : (
          <ReportsMap className="h-[28rem] rounded-[20px] overflow-hidden" reports={reportPins} center={mapCenter} />
        )}
      </div>

      {/* LGU Performance Leaderboard */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">LGU Performance Leaderboard</h3>
            <p className="text-sm font-serif italic text-accent mt-1">Summary of reporting workloads per active tenant</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="!bg-accent !text-white !border-0 hover:opacity-90" onClick={() => {
              const rows = (selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, 'Active'].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
              const csv = ['LGU,Users,Reports,Requests,Avg Response,Status', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lgu-leaderboard.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                <th className="pb-3 pl-10 pr-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">LGU</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Users</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Reports</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Requests</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Avg Response</th>
                <th className="pb-3 pl-6 pr-10 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map((lgu, i) => (
                <motion.tr
                  key={lgu.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.04, ease: 'easeOut' }}
                  className="bg-surface hover:bg-surface-alt transition-colors group"
                >
                  <td className="py-5 pl-10 pr-6 rounded-l-full">
                    <span className="font-semibold text-[15px] text-text-primary">{lgu.name}</span>
                  </td>
                  <td className="py-5 px-6 text-sm font-mono text-text-muted">{lgu.users.toLocaleString()}</td>
                  <td className="py-5 px-6 text-sm font-mono font-semibold text-text-muted">{lgu.reports}</td>
                  <td className="py-5 px-6 text-sm font-mono font-semibold text-text-muted">{lgu.requests}</td>
                  <td className="py-5 px-6 text-sm text-text-muted">{lgu.responseTime}</td>
                  <td className="py-5 pl-6 pr-10 rounded-r-full text-right">
                    <Badge variant={lgu.status === 'active' ? 'success' : 'default'} className="rounded-full px-3 py-1">
                      {lgu.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
