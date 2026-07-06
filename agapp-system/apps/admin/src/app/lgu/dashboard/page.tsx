'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { lguIdFromName } from '@/lib/lgu';
import { ReportsMap, type ReportPin } from '@/components/map';
import { Warning, FileText, CheckCircle, ArrowRight, MapPin, IdentificationBadge } from '@phosphor-icons/react';

type DbReportStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

type DashboardReportStatus = 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';

const mapDbStatusToDashboard = (status: string): DashboardReportStatus => {
  switch (status as DbReportStatus) {
    case 'Submitted':
      return 'pending';
    case 'Under Review':
      return 'acknowledged';
    case 'In Progress':
      return 'in_progress';
    case 'Resolved':
      return 'resolved';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

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

// Distinct hues per category so the distribution panel reads at a glance —
// same idea as STATUS_COLORS in components/map/markers.ts, separate palette
// since this tracks category, not status.
const CATEGORY_COLORS: Record<string, string> = {
  'Pothole / Road Damage': '#ff758f',
  'Drainage / Canal': '#5b8def',
  'Stray Pets': '#f5a623',
  'Damaged Pole': '#8b7cf6',
};

// True Liliw poblacion (PhilAtlas) — only used until the LGU row loads.
const LILIW_FALLBACK: [number, number] = [14.131, 121.4365];

export default function DashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = params?.get('lguName') || 'Liliw, Laguna';
  const reportsHref = lguParam ? `/lgu/reports?lguName=${encodeURIComponent(lguParam)}` : '/lgu/reports';
  const lguId = lguIdFromName(lguParam);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [serviceRows, setServiceRows] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>(LILIW_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);

      const [
        { data: reportsData, error: reportsError },
        { data: servicesData, error: servicesError },
        { data: verifData, error: verifError },
        { data: lguRow },
      ] = await Promise.all([
        supabase
          .from('reports')
          .select('id, reference_number, category, status, barangay, created_at, latitude, longitude, photo_url')
          .eq('lgu_id', lguId),
        supabase
          .from('service_requests')
          .select('id, reference_number, status, created_at')
          .eq('lgu_id', lguId),
        supabase
          .from('verification_requests')
          .select('id, status')
          .eq('lgu_id', lguId)
          .eq('status', 'pending'),
        supabase.from('lgus').select('latitude, longitude').eq('id', lguId).single(),
      ]);

      if (reportsError || servicesError) {
        console.error('Error loading dashboard metrics', reportsError || servicesError);
        setLoadError((reportsError || servicesError)?.message || 'Unknown error');
        setReportRows([]);
        setServiceRows([]);
        setLoading(false);
        return;
      }

      setReportRows(reportsData || []);
      setServiceRows(servicesData || []);
      if (!verifError) setPendingVerifications(verifData?.length || 0);
      if (lguRow?.latitude && lguRow?.longitude) setMapCenter([lguRow.latitude, lguRow.longitude]);
      setLoading(false);
    };

    fetchData();
  }, [lguId]);

  const stats = useMemo(() => {
    const submittedCount = reportRows.filter((r) => r.status === 'Submitted').length;
    const underReviewCount = reportRows.filter((r) => r.status === 'Under Review').length;
    const totalServiceRequests = serviceRows.length;
    const activeBarangays = new Set(reportRows.map((r) => r.barangay).filter(Boolean)).size;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const resolvedThisWeek = reportRows.filter(
      (r) => r.status === 'Resolved' && r.created_at && new Date(r.created_at) >= sevenDaysAgo
    ).length;
    const verifHref = lguParam ? `/lgu/verifications?lguName=${encodeURIComponent(lguParam)}` : '/lgu/verifications';

    return [
      {
        label: 'Pending Reports',
        value: submittedCount.toString(),
        change: underReviewCount > 0 ? `${underReviewCount} under review` : 'none under review',
        icon: Warning,
      },
      {
        label: 'Service Requests',
        value: totalServiceRequests.toString(),
        change: activeBarangays > 0 ? `${activeBarangays} barangays active` : '',
        icon: FileText,
      },
      {
        label: 'Pending Verifications',
        value: pendingVerifications.toString(),
        change: pendingVerifications > 0 ? 'field agents dispatched' : 'all caught up',
        icon: IdentificationBadge,
        href: verifHref,
      },
      { label: 'Resolved This Week', value: resolvedThisWeek.toString(), change: '', icon: CheckCircle },
    ];
  }, [reportRows, serviceRows, pendingVerifications, lguParam]);

  // Real live category breakdown — no fabricated trend data, just today's
  // actual counts and their share of the total.
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reportRows) {
      const label = mapDbCategoryToLabel(r.category);
      counts[label] = (counts[label] || 0) + 1;
    }
    const total = reportRows.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[label] || '#8a8a8a',
      }));
  }, [reportRows]);

  // Report pins for the interactive map — every report carries the citizen's
  // real GPS coordinates captured at submission time.
  const reportPins = useMemo<ReportPin[]>(
    () =>
      reportRows
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
    [reportRows]
  );

  const recentReports = useMemo(() => {
    const sorted = [...reportRows].sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });

    return sorted.slice(0, 10).map((r) => ({
      id: r.reference_number || r.id,
      category: mapDbCategoryToLabel(r.category),
      location: r.barangay,
      status: mapDbStatusToDashboard(r.status || 'Submitted'),
      time: r.created_at ? new Date(r.created_at).toLocaleString() : '',
    }));
  }, [reportRows]);

  return (
    <DashboardLayout
      role="lgu-admin"
      title="Dashboard Overview"
      heroKicker={`${lguParam.toUpperCase()} — MUNICIPAL CONTROL CENTER`}
      heroTitleAccent="Agapp Portal"
      heroSubtitle="Real-time visual reports tracking system for municipal hazard logging, business licensing, and citizen service requests."
    >
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm font-mono text-text-muted bg-surface-alt rounded-xl animate-pulse">
          Loading dashboard metrics…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-accent bg-accent-soft rounded-xl">
          Failed to load dashboard metrics: {loadError}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const content = (
            <>
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold text-text-primary">{stat.label}</p>
                <div className="p-1.5 rounded-lg bg-surface-alt border border-theme">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[32px] font-mono font-bold text-text-primary tracking-tight leading-none">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs font-serif italic text-accent mt-1">{stat.change}</p>
                )}
              </div>
            </>
          );
          return (
            <Card key={stat.label} noBorder className="rounded-[20px] min-h-[140px] flex flex-col justify-between">
              {stat.href ? <Link href={stat.href} className="w-full h-full flex flex-col justify-between">{content}</Link> : content}
            </Card>
          );
        })}
      </div>

      {/* Bento: 8-col map / 4-col categorical distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-bold text-text-primary">Reports Hotspot Map</h3>
              <p className="text-sm font-serif italic text-accent mt-1">
                {lguParam} · Live locations of citizen reports
              </p>
            </div>
            <Link href={reportsHref}>
              <Button variant="secondary" size="sm" className="!bg-accent !text-white !border-0 hover:opacity-90">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {!loading && reportPins.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-text-primary bg-surface-alt/30 rounded-2xl">
              No reports with location data yet.
            </div>
          ) : (
            <ReportsMap
              className="h-[26rem] rounded-[20px] overflow-hidden"
              reports={reportPins}
              center={mapCenter}
              getDetailHref={(r) =>
                `/lgu/reports?lguName=${encodeURIComponent(lguParam)}&reportId=${encodeURIComponent(r.refNumber)}`
              }
            />
          )}
        </div>

        <Card className="lg:col-span-4 rounded-[20px]" noBorder>
          <p className="text-[11px] font-mono font-semibold tracking-widest text-accent uppercase mb-1">Distribution</p>
          <p className="text-sm text-text-primary/70 mb-6">
            Live categorical distribution of citizen reports active in the municipality system.
          </p>

          {categoryDistribution.length === 0 ? (
            <p className="text-sm text-text-primary italic">No reports logged yet.</p>
          ) : (
            <div className="space-y-5">
              {categoryDistribution.map((cat, i) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-text-primary">{cat.label}</span>
                    <span className="text-xs font-mono font-medium text-text-primary/70">{cat.count} item{cat.count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-theme overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${cat.pct}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 18, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card noBorder className="rounded-[20px]">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">Recent Submissions</h3>
          </div>
          <Link href={reportsHref}>
            <Button variant="secondary" size="sm" className="!bg-accent !text-white !border-0 hover:opacity-90">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                <th className="pb-2 pl-10 pr-4 text-xs font-medium text-text-primary/80 uppercase tracking-wider">ID</th>
                <th className="pb-2 px-4 text-xs font-medium text-text-primary/80 uppercase tracking-wider">Category</th>
                <th className="pb-2 px-4 text-xs font-medium text-text-primary/80 uppercase tracking-wider">Location</th>
                <th className="pb-2 px-4 text-xs font-medium text-text-primary/80 uppercase tracking-wider">Status</th>
                <th className="pb-2 pl-4 pr-10 text-xs font-medium text-text-primary/80 uppercase tracking-wider text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr
                  key={report.id}
                  className="bg-surface-alt hover:bg-accent-soft transition-colors cursor-pointer group"
                  onClick={() => router.push(`/lgu/reports?lguName=${encodeURIComponent(lguParam)}&reportId=${encodeURIComponent(report.id)}`)}
                >
                  <td className="py-5 pl-10 pr-4 rounded-l-xl text-sm font-mono font-medium text-text-primary">{report.id}</td>
                  <td className="py-5 px-4 text-sm text-text-primary">{report.category}</td>
                  <td className="py-5 px-4 text-sm text-text-primary/80">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-accent" />
                      {report.location}
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <Badge
                      variant={
                        report.status === 'resolved' ? 'success' :
                        report.status === 'in_progress' ? 'info' :
                        report.status === 'acknowledged' ? 'default' :
                        'warning'
                      }
                    >
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-5 pl-4 pr-10 rounded-r-xl text-xs font-mono text-text-primary/70 text-right">{report.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
