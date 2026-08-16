'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SearchNormal1,
  CloseCircle,
  DocumentText,
  Danger,
  Messages1,
  Location,
  NotificationBing,
  Book,
  MessageQuestion,
  User,
  ShieldSecurity,
  Call,
  Moon,
  Sun1,
  Building,
  ArrowRight2,
  Routing2,
  DirectRight
} from 'iconsax-react';
import { supabase } from '../../lib/supabase';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBadge } from '../common/StatusBadge';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'services' | 'news' | 'forum' | 'reports' | 'facilities' | 'guides' | 'actions';

const QUICK_ACTIONS = [
  { label: 'Submit Incident Report', description: 'File hazard, road damage, or public safety report', href: '/report', icon: Danger, category: 'reports' },
  { label: 'Apply for E-Services', description: 'Clearances, permits, tax certificates & civil documents', href: '/services', icon: DocumentText, category: 'services' },
  { label: 'Track My Applications', description: 'Real-time progress on filed service requests & reports', href: '/tracking', icon: Routing2, category: 'actions' },
  { label: 'Emergency Hotlines & 911', description: 'MDRRMO, BFP, PNP & Ambulance fast dispatch', href: '/emergency', icon: Call, category: 'actions' },
  { label: 'Explore Town Map', description: 'Municipal hall, health clinics, schools & evacuation centers', href: '/map', icon: Location, category: 'facilities' },
  { label: 'AI Municipal Assistant', description: 'Ask questions in Tagalog or English about procedures', href: '/chatbot', icon: MessageQuestion, category: 'actions' },
  { label: 'Resident Identity Verification', description: 'Upload government ID for fast-track processing', href: '/verify', icon: ShieldSecurity, category: 'actions' },
  { label: 'My Resident Profile & Settings', description: 'Manage account, contact number & barangay', href: '/profile', icon: User, category: 'actions' },
  { label: 'Community Discussion Forum', description: 'View barangay topics, feedback & community initiatives', href: '/forum', icon: Messages1, category: 'forum' },
  { label: 'News & Official Bulletins', description: 'Live municipal announcements & weather advisories', href: '/news', icon: NotificationBing, category: 'news' },
  { label: 'Citizen Requirements Guides', description: 'Step-by-step procedures and required documents', href: '/guides', icon: Book, category: 'guides' },
];

const REPORT_QUICK_JUMPS = [
  { name: 'Road & Pothole Damage', desc: 'Broken asphalt, hazardous road cracks', href: '/report?cat=infrastructure' },
  { name: 'Power & Streetlight Outage', desc: 'Unlit streets, broken electrical poles', href: '/report?cat=utilities' },
  { name: 'Flooding & Drainage Blockage', desc: 'Clogged canals, overflowing runoff', href: '/report?cat=flooding' },
  { name: 'Garbage & Waste Collection', desc: 'Uncollected trash, illegal dumping', href: '/report?cat=sanitation' },
  { name: 'Public Safety & Noise Hazard', desc: 'Disturbances, stray animals, safety issues', href: '/report?cat=safety' },
];

export function CommandSearchModal({ isOpen, onClose }: CommandSearchModalProps) {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchCategory>('all');
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<{
    services: any[];
    news: any[];
    forum: any[];
    facilities: any[];
    guides: any[];
  }>({
    services: [],
    news: [],
    forum: [],
    facilities: [],
    guides: [],
  });

  // Focus input on open & lock background scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    } else {
      setSearchQuery('');
      setSelectedFilter('all');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Live Multi-Table Search Query with Debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults({ services: [], news: [], forum: [], facilities: [], guides: [] });
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const lguId = activeLgu?.id || 'liliw-laguna';

        const [srvRes, newsRes, forumRes, facRes, guideRes] = await Promise.all([
          supabase
            .from('lgu_services')
            .select('*')
            .eq('lgu_id', lguId)
            .or(`name.ilike.%${q}%,description.ilike.%${q}%,office_name.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('news_announcements')
            .select('*')
            .eq('lgu_id', lguId)
            .or(`title.ilike.%${q}%,content.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('forum_posts')
            .select('*')
            .eq('lgu_id', lguId)
            .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('lgu_facilities')
            .select('*')
            .eq('lgu_id', lguId)
            .or(`name.ilike.%${q}%,address.ilike.%${q}%,type.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('citizen_guides')
            .select('*')
            .eq('lgu_id', lguId)
            .or(`title.ilike.%${q}%,description.ilike.%${q}%,section.ilike.%${q}%`)
            .limit(5),
        ]);

        setResults({
          services: srvRes.data || [],
          news: newsRes.data || [],
          forum: forumRes.data || [],
          facilities: facRes.data || [],
          guides: guideRes.data || [],
        });
      } catch (err) {
        console.error('Command search query error:', err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, activeLgu?.id]);

  // Filtered Quick Actions & Reports
  const matchingActions = useMemo(() => {
    if (!searchQuery.trim()) return QUICK_ACTIONS;
    const q = searchQuery.toLowerCase();
    return QUICK_ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const matchingReports = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_QUICK_JUMPS;
    const q = searchQuery.toLowerCase();
    return REPORT_QUICK_JUMPS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || q.includes('report')
    );
  }, [searchQuery]);

  const totalResultsCount =
    results.services.length +
    results.news.length +
    results.forum.length +
    results.facilities.length +
    results.guides.length +
    (searchQuery.trim() ? matchingActions.length + matchingReports.length : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-md animate-fade-in transition-all">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Command Box */}
      <div className="relative w-full max-w-3xl rounded-[28px] bg-surface dark:bg-[#23201E] border border-theme shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] transition-all z-10">
        {/* Header Input Area */}
        <div className="p-4 sm:p-5 border-b border-theme space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <SearchNormal1 size={20} className="text-text-muted shrink-0" variant="Linear" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search services, news, forums, reports, locations in ${activeLgu?.name?.replace('Municipality of ', '') || 'Liliw'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm sm:text-base font-['Inter-Medium'] bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-text-muted hover:text-text-primary p-1 transition"
                title="Clear query"
                aria-label="Clear query"
              >
                <CloseCircle size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-muted hover:text-text-primary hover:bg-surface transition shrink-0 flex items-center justify-center cursor-pointer"
              title="Close search (ESC)"
              aria-label="Close search"
            >
              <CloseCircle size={18} />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'services', label: 'E-Services' },
              { id: 'news', label: 'News & Bulletins' },
              { id: 'forum', label: 'Forums' },
              { id: 'reports', label: 'Report Incident' },
              { id: 'facilities', label: 'Map Locations' },
              { id: 'guides', label: 'Guides' },
              { id: 'actions', label: 'Actions & Settings' },
            ].map((tab) => {
              const active = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id as SearchCategory)}
                  className={`px-3 py-1 rounded-full text-[11px] font-['Octarine-Bold'] whitespace-nowrap transition ${
                    active
                      ? 'bg-accent text-accent-contrast shadow-2xs'
                      : 'bg-surface-alt dark:bg-chip text-text-muted hover:text-text-primary border border-theme'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 sidebar-nav-scroll">
          {searching ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-muted font-['Inter-Medium']">Searching all municipal records...</p>
            </div>
          ) : !searchQuery.trim() ? (
            /* Default / Empty State Suggestions */
            <div className="space-y-6">
              {/* Quick Actions Grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-text-muted block pl-1">
                  Quick System Actions & Settings
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QUICK_ACTIONS.slice(0, 6).map((action) => {
                    const IconComp = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt/70 dark:bg-chip/60 border border-theme hover:border-accent hover:shadow-xs transition group flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-surface dark:bg-card border border-theme flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                          <IconComp size={18} variant="Bold" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                            {action.label}
                          </h4>
                          <p className="text-[10.5px] text-text-muted font-['Inter-Medium'] truncate mt-0.5">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight2 size={13} className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Instant Incident Reporting Jumps */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                  File an Incident Report
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REPORT_QUICK_JUMPS.map((rep) => (
                    <Link
                      key={rep.name}
                      href={rep.href}
                      onClick={onClose}
                      className="p-2.5 rounded-xl bg-surface dark:bg-card border border-theme hover:border-accent transition flex items-center justify-between text-xs group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-['Octarine-Bold'] text-text-primary block truncate group-hover:text-accent transition">
                          {rep.name}
                        </span>
                        <span className="text-[10px] text-text-muted font-['Inter-Medium'] block truncate">
                          {rep.desc}
                        </span>
                      </div>
                      <DirectRight size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : totalResultsCount === 0 ? (
            /* No Results Found */
            <div className="py-12 text-center space-y-2">
              <SearchNormal1 size={32} className="text-text-muted mx-auto" />
              <p className="text-xs font-['Octarine-Bold'] text-text-primary">No results found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-[11px] text-text-muted font-['Inter-Medium']">
                Try searching with a broader term or check another category filter above.
              </p>
            </div>
          ) : (
            /* Active Query Results Grouped by Category */
            <div className="space-y-6">
              {/* 1. E-Services Matches */}
              {(selectedFilter === 'all' || selectedFilter === 'services') && results.services.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    E-Services ({results.services.length})
                  </span>
                  <div className="space-y-2">
                    {results.services.map((srv) => (
                      <Link
                        key={srv.id}
                        href="/services"
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={srv.office_name || 'Municipal'} />
                            <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                              {srv.name}
                            </h4>
                          </div>
                          {srv.description && (
                            <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate mt-1">
                              {srv.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. News & Advisories Matches */}
              {(selectedFilter === 'all' || selectedFilter === 'news') && results.news.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    News & Advisories ({results.news.length})
                  </span>
                  <div className="space-y-2">
                    {results.news.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.category || item.type || 'News'} />
                            <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate mt-1">
                            {item.content}
                          </p>
                        </div>
                        <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Community Forum Matches */}
              {(selectedFilter === 'all' || selectedFilter === 'forum') && results.forum.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    Community Forum Discussions ({results.forum.length})
                  </span>
                  <div className="space-y-2">
                    {results.forum.map((post) => (
                      <Link
                        key={post.id}
                        href="/forum"
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={Array.isArray(post.tags) ? post.tags[0] : post.tags || 'Topic'} />
                            <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                              {post.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate mt-1">
                            {post.content}
                          </p>
                        </div>
                        <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Town Map Facilities Matches */}
              {(selectedFilter === 'all' || selectedFilter === 'facilities') && results.facilities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    Map Locations & Facilities ({results.facilities.length})
                  </span>
                  <div className="space-y-2">
                    {results.facilities.map((fac) => (
                      <Link
                        key={fac.id}
                        href="/map"
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={fac.category || fac.type || 'Office'} />
                            <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                              {fac.name}
                            </h4>
                          </div>
                          {fac.address && (
                            <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate mt-1 flex items-center gap-1">
                              <Location size={11} className="text-accent shrink-0" />
                              <span>{fac.address}</span>
                            </p>
                          )}
                        </div>
                        <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Citizen Guides Matches */}
              {(selectedFilter === 'all' || selectedFilter === 'guides') && results.guides.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    Citizen Requirements & Guides ({results.guides.length})
                  </span>
                  <div className="space-y-2">
                    {results.guides.map((guide) => (
                      <Link
                        key={guide.id}
                        href="/guides"
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-['Octarine-Bold'] uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                              {guide.section || 'Guide'}
                            </span>
                            <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                              {guide.title}
                            </h4>
                          </div>
                          {guide.description && (
                            <p className="text-[11px] text-text-muted font-['Inter-Medium'] truncate mt-1">
                              {guide.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Matching System Actions & Reports */}
              {(selectedFilter === 'all' || selectedFilter === 'actions' || selectedFilter === 'reports') && matchingActions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block pl-1">
                    System Actions & Navigation ({matchingActions.length})
                  </span>
                  <div className="space-y-2">
                    {matchingActions.map((act) => {
                      const IconComp = act.icon;
                      return (
                        <Link
                          key={act.label}
                          href={act.href}
                          onClick={onClose}
                          className="p-3 rounded-2xl bg-surface dark:bg-card border border-theme hover:border-accent transition flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-accent shrink-0">
                              <IconComp size={16} variant="Bold" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition truncate">
                                {act.label}
                              </h4>
                              <p className="text-[10.5px] text-text-muted font-['Inter-Medium'] truncate">
                                {act.description}
                              </p>
                            </div>
                          </div>
                          <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 px-5 border-t border-theme bg-surface-alt/60 dark:bg-chip/40 flex items-center justify-between text-[11px] text-text-muted font-['Inter-Medium'] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface dark:bg-card border border-theme font-mono text-[9px]">ESC</kbd>
              <span>to close</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface dark:bg-card border border-theme font-mono text-[9px]">Tab</kbd>
              <span>to filter</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
