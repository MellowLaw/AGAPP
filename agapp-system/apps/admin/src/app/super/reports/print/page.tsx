'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft, DocumentDownload, FilterSearch as Filter, Building, Calendar, ShieldTick } from 'iconsax-react';

interface ReportItem {
  id: string;
  reference_number: string;
  lgu_id: string;
  category: string;
  status: string;
  barangay: string | null;
  created_at: string;
  updated_at: string;
  sla_due_date: string | null;
}

interface ServiceRequestItem {
  id: string;
  reference_number: string;
  lgu_id: string;
  service_type: string;
  office_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LguItem {
  id: string;
  name: string;
  is_active: boolean;
}

const CATEGORY_OPTIONS = [
  { key: 'overall', label: 'Overall Platform Executive Audit' },
  { key: 'pothole', label: 'Pothole & Road Infrastructure' },
  { key: 'clogged_drainage', label: 'Drainage & Waterways' },
  { key: 'stray_animal', label: 'Stray Pets & Animal Welfare' },
  { key: 'damaged_pole', label: 'Damaged Pole & Utility Hazards' },
  { key: 'eservices', label: 'eServices & Municipal Permits' },
  { key: 'moderation', label: 'Citizen Moderation & Appeals Audit' },
];

import { Suspense } from 'react';

function PrintableReportContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'overall';
  const initialLgu = searchParams.get('lgu') || 'all';

  const [category, setCategory] = useState<string>(initialCategory);
  const [selectedLgu, setSelectedLgu] = useState<string>(initialLgu);
  const [loading, setLoading] = useState(true);

  const [lgus, setLgus] = useState<LguItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const [{ data: dbLgus }, { data: dbReports }, { data: dbRequests }, { data: dbUsers }] = await Promise.all([
          supabase.from('lgus').select('id, name, is_active').order('name'),
          supabase.from('reports').select('*').order('created_at', { ascending: false }),
          supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('id, role, lgu_id, moderation_status, verification_status'),
        ]);

        if (dbLgus) setLgus(dbLgus);
        if (dbReports) setReports(dbReports as any);
        if (dbRequests) setRequests(dbRequests as any);
        if (dbUsers) setUsers(dbUsers);
      } catch (err) {
        console.error('[SuperPrintableReport] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Filtered data based on LGU selection
  const lguFilteredReports = useMemo(() => {
    if (selectedLgu === 'all') return reports;
    return reports.filter(r => r.lgu_id === selectedLgu);
  }, [reports, selectedLgu]);

  const lguFilteredRequests = useMemo(() => {
    if (selectedLgu === 'all') return requests;
    return requests.filter(r => r.lgu_id === selectedLgu);
  }, [requests, selectedLgu]);

  const lguMap = useMemo(() => {
    const map = new Map<string, string>();
    lgus.forEach(l => map.set(l.id, l.name));
    return map;
  }, [lgus]);

  // Specific Category Filtered Records
  const filteredRecords = useMemo(() => {
    if (category === 'overall') {
      return lguFilteredReports;
    } else if (category === 'eservices') {
      return lguFilteredRequests;
    } else if (category === 'moderation') {
      return lguFilteredReports;
    } else {
      return lguFilteredReports.filter(r => r.category === category);
    }
  }, [category, lguFilteredReports, lguFilteredRequests]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalReports = lguFilteredReports.length;
    const totalRequests = lguFilteredRequests.length;
    const totalCitizens = users.filter(u => u.role === 'CITIZEN' && (selectedLgu === 'all' || u.lgu_id === selectedLgu)).length;
    
    const resolvedReports = lguFilteredReports.filter(r => r.status === 'Resolved').length;
    const completedRequests = lguFilteredRequests.filter(r => r.status === 'Released' || r.status === 'Approved').length;
    
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 100;

    return {
      totalReports,
      totalRequests,
      totalCitizens,
      resolvedReports,
      completedRequests,
      resolutionRate,
    };
  }, [lguFilteredReports, lguFilteredRequests, users, selectedLgu]);

  const handlePrint = () => {
    window.print();
  };

  const selectedLguName = selectedLgu === 'all' ? 'All Municipalities' : lguMap.get(selectedLgu) || selectedLgu;
  const currentCategoryLabel = CATEGORY_OPTIONS.find(c => c.key === category)?.label || 'Executive Summary';

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans print:bg-white print:text-black print:p-0">
      
      {/* Top Action Bar (Hidden when Printing) */}
      <div className="print:hidden sticky top-0 z-50 bg-neutral-900 text-white px-6 py-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/super">
            <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </Link>
          <div className="h-4 w-[1px] bg-neutral-700" />
          <h1 className="text-sm font-bold tracking-tight">Printable Executive Report Generator</h1>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-neutral-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* LGU Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400 font-medium">Scope:</span>
            <select
              value={selectedLgu}
              onChange={(e) => setSelectedLgu(e.target.value)}
              className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-neutral-900 text-white">All LGUs</option>
              {lgus.map(l => (
                <option key={l.id} value={l.id} className="bg-neutral-900 text-white">{l.name}</option>
              ))}
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Official Document Sheet */}
      <div id="printable-document" className="max-w-[900px] mx-auto my-6 print:my-0 print:max-w-none bg-white p-10 print:p-8 shadow-xl print:shadow-none border border-neutral-200 print:border-0 rounded-2xl print:rounded-none">
        
        {/* Header Block */}
        <div className="border-b-2 border-neutral-900 pb-6 mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest uppercase bg-neutral-900 text-white px-2 py-0.5 rounded font-bold">
                OFFICIAL SYSTEM AUDIT REPORT
              </span>
              <span className="text-[11px] font-semibold text-neutral-500">
                AGAPP MONOREPO • MUNICIPAL CONTROL CENTER
              </span>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
              {currentCategoryLabel}
            </h1>
            <p className="text-xs text-neutral-600 mt-1 font-medium">
              Scope: <span className="font-bold text-neutral-900">{selectedLguName}</span> • Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right border-l-2 border-neutral-200 pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">AUTHORITY</p>
            <p className="text-xs font-bold text-neutral-900">Super Admin Office</p>
            <p className="text-[11px] text-neutral-500 font-mono">ID: SA-{Math.floor(1000 + Math.random() * 9000)}</p>
          </div>
        </div>

        {/* Executive Summary Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Workload</p>
            <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">
              {category === 'eservices' ? stats.totalRequests : stats.totalReports}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {category === 'eservices' ? 'Service applications' : 'Citizen reports'}
            </p>
          </div>

          <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Resolved / Released</p>
            <p className="text-xl font-mono font-bold text-emerald-700 mt-0.5">
              {category === 'eservices' ? stats.completedRequests : stats.resolvedReports}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Successfully closed</p>
          </div>

          <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Resolution Rate</p>
            <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">{stats.resolutionRate}%</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Completed workload ratio</p>
          </div>

          <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Citizen Base</p>
            <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">{stats.totalCitizens.toLocaleString()}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Registered accounts</p>
          </div>
        </div>

        {/* Breakdown Summary Section */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
            Municipal Workload Breakdown by LGU
          </h2>
          <table className="w-full text-xs text-left border-collapse border border-neutral-300">
            <thead>
              <tr className="bg-neutral-900 text-white font-bold">
                <th className="p-2 border border-neutral-800">LGU Name</th>
                <th className="p-2 border border-neutral-800 text-center">Citizen Count</th>
                <th className="p-2 border border-neutral-800 text-center">Reports Filed</th>
                <th className="p-2 border border-neutral-800 text-center">eServices Filed</th>
                <th className="p-2 border border-neutral-800 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {lgus
                .filter(l => selectedLgu === 'all' || l.id === selectedLgu)
                .map((lgu, idx) => {
                  const lguReports = reports.filter(r => r.lgu_id === lgu.id).length;
                  const lguRequests = requests.filter(r => r.lgu_id === lgu.id).length;
                  const lguUsers = users.filter(u => u.lgu_id === lgu.id && u.role === 'CITIZEN').length;
                  return (
                    <tr key={lgu.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      <td className="p-2 border border-neutral-300 font-semibold">{lgu.name}</td>
                      <td className="p-2 border border-neutral-300 text-center font-mono">{lguUsers}</td>
                      <td className="p-2 border border-neutral-300 text-center font-mono">{lguReports}</td>
                      <td className="p-2 border border-neutral-300 text-center font-mono">{lguRequests}</td>
                      <td className="p-2 border border-neutral-300 text-center font-bold text-emerald-700">
                        {lgu.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Itemized Audit Log Table */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
            Itemized Audit Log ({filteredRecords.length} Records)
          </h2>
          {filteredRecords.length === 0 ? (
            <p className="text-xs text-neutral-500 italic p-4 text-center border border-dashed border-neutral-300 rounded-lg">
              No matching records found for category "{currentCategoryLabel}" in scope {selectedLguName}.
            </p>
          ) : (
            <table className="w-full text-[11px] text-left border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-200 text-neutral-900 font-bold uppercase">
                  <th className="p-2 border border-neutral-300">Reference #</th>
                  <th className="p-2 border border-neutral-300">Municipality</th>
                  <th className="p-2 border border-neutral-300">Category / Type</th>
                  <th className="p-2 border border-neutral-300">Barangay / Location</th>
                  <th className="p-2 border border-neutral-300">Date Filed</th>
                  <th className="p-2 border border-neutral-300 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 50).map((rec: any, idx) => (
                  <tr key={rec.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="p-2 border border-neutral-300 font-mono font-bold">{rec.reference_number || rec.id.slice(0, 8)}</td>
                    <td className="p-2 border border-neutral-300">{lguMap.get(rec.lgu_id) || rec.lgu_id}</td>
                    <td className="p-2 border border-neutral-300 capitalize">{rec.category || rec.service_type || 'N/A'}</td>
                    <td className="p-2 border border-neutral-300">{rec.barangay || rec.office_name || 'Central'}</td>
                    <td className="p-2 border border-neutral-300">{new Date(rec.created_at).toLocaleDateString()}</td>
                    <td className="p-2 border border-neutral-300 text-center font-semibold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        ['Resolved', 'Released', 'Approved'].includes(rec.status)
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredRecords.length > 50 && (
            <p className="text-[10px] text-neutral-500 italic mt-1 text-right">
              Showing first 50 itemized records of {filteredRecords.length} total entries.
            </p>
          )}
        </div>

        {/* Official Certification & Sign-off Section */}
        <div className="pt-8 border-t-2 border-neutral-900 grid grid-cols-2 gap-12 mt-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-8">PREPARED & VERIFIED BY:</p>
            <div className="border-b border-neutral-900 w-3/4 mb-1" />
            <p className="text-xs font-bold text-neutral-900">SUPERADMIN OFFICER</p>
            <p className="text-[10px] text-neutral-500">Agapp Municipal Control Center</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-8">CERTIFIED & NOTED BY:</p>
            <div className="border-b border-neutral-900 w-3/4 mb-1" />
            <p className="text-xs font-bold text-neutral-900">MUNICIPAL ADMINISTRATOR / HEAD OF OFFICE</p>
            <p className="text-[10px] text-neutral-500">Local Government Unit Representative</p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function SuperAdminPrintableReport() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-neutral-600">Loading Printable Audit Generator...</div>}>
      <PrintableReportContent />
    </Suspense>
  );
}
