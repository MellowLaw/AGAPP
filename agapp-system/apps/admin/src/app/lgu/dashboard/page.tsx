'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
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

// True Liliw poblacion (PhilAtlas) — only used until the LGU row loads.
const LILIW_FALLBACK: [number, number] = [14.131, 121.4365];

export default function DashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = params?.get('lguName') || 'Liliw, Laguna';
  const reportsHref = lguParam ? `/lgu/reports?lguName=${encodeURIComponent(lguParam)}` : '/lgu/reports';
  const lguId = lguParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');
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
        change: underReviewCount > 0 ? `${underReviewCount} under review` : '',
        icon: Warning,
        color: 'text-[#ca8a04]',
      },
      { label: 'Service Requests', value: totalServiceRequests.toString(), change: '', icon: FileText, color: 'text-[#2563eb]' },
      {
        label: 'Pending Verifications',
        value: pendingVerifications.toString(),
        change: pendingVerifications > 0 ? 'needs review' : 'all caught up',
        icon: IdentificationBadge,
        color: pendingVerifications > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]',
        href: verifHref,
      },
      { label: 'Resolved This Week', value: resolvedThisWeek.toString(), change: '', icon: CheckCircle, color: 'text-[#16a34a]' },
    ];
  }, [reportRows, serviceRows, pendingVerifications, lguParam]);

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
    >
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#737373] bg-[#f5f5f5] rounded-md animate-pulse">
          Loading dashboard metrics…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#dc2626] bg-[#fef2f2] rounded-md">
          Failed to load dashboard metrics: {loadError}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#737373]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5">{stat.value}</p>
                {stat.change && (
                  <p className="text-[10px] text-[#ca8a04] font-medium mt-1">{stat.change}</p>
                )}
              </div>
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
          return (
            <Card key={stat.label} padding="sm" className="shadow-sm border border-[#e5e5e5] hover:border-gray-300 transition-all duration-200">
              {stat.href ? <Link href={stat.href}>{content}</Link> : content}
            </Card>
          );
        })}
      </div>

      {/* Reports Map — replaces the old category/status/trend charts with the
          actual geography of citizen reports for this municipality. */}
      <Card className="mb-6 shadow-sm border border-[#e5e5e5]">
        <CardHeader
          title="Reports Map"
          subtitle="Live locations of citizen reports — click a pin for details"
          action={
            <Link href={reportsHref}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          }
        />
        {!loading && reportPins.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-[#737373]">
            No reports with location data yet.
          </div>
        ) : (
          <ReportsMap
            className="h-[28rem]"
            reports={reportPins}
            center={mapCenter}
            getDetailHref={(r) =>
              `/lgu/reports?lguName=${encodeURIComponent(lguParam)}&reportId=${encodeURIComponent(r.refNumber)}`
            }
          />
        )}
      </Card>

      {/* Recent Submissions */}
      <Card className="shadow-sm border border-[#e5e5e5]">
        <CardHeader
          title="Recent Submissions"
          action={
            <Link href={reportsHref}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-left">
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Location</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-all cursor-pointer"
                  onClick={() => router.push(`/lgu/reports?lguName=${encodeURIComponent(lguParam)}&reportId=${encodeURIComponent(report.id)}`)}
                >
                  <td className="py-4 px-4 text-sm font-semibold text-[#1a1a1a]">{report.id}</td>
                  <td className="py-4 px-4 text-sm text-[#525252] font-medium">{report.category}</td>
                  <td className="py-4 px-4 text-sm text-[#737373]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#a3a3a3]" />
                      {report.location}
                    </div>
                  </td>
                  <td className="py-4 px-4">
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
                  <td className="py-4 px-4 text-xs text-[#737373] font-medium">{report.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
