'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { supabase } from '../../lib/supabase';
import { getRelativeTime } from '../../lib/timeAgo';
import { getNewsImageUrl, isItemExpired } from '../../lib/newsHelpers';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonFeed } from '../../components/common/Skeleton';
import { 
  NotificationBing, 
  SearchNormal1, 
  Calendar, 
  ShieldSecurity,
  ArrowRight2,
  DocumentText,
  Danger,
  ArchiveBox,
  ArrowLeft2
} from 'iconsax-react';

export default function NewsPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const [allNews, setAllNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<'news' | 'advisories' | 'archived'>('news');

  const fetchNews = useCallback(async () => {
    if (!activeLgu?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .or('status.eq.published,status.eq.archived')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAllNews(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  }, [activeLgu?.id]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Filter based on search text
  const searchFiltered = allNews.filter((n) =>
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by segments matching mobile NewsScreen
  let displayedItems: any[] = [];

  if (activeSegment === 'archived') {
    displayedItems = searchFiltered.filter((n) => {
      const expired = isItemExpired(n);
      return n.status === 'archived' || expired;
    });
  } else if (activeSegment === 'advisories') {
    displayedItems = searchFiltered.filter((n) => {
      const expired = isItemExpired(n);
      const isAdvisoryOrAnnouncement = n.type === 'advisory' || n.type === 'announcement' || n.category === 'advisory' || n.category === 'weather';
      return n.status === 'published' && !expired && isAdvisoryOrAnnouncement;
    });
  } else {
    // 'news' segment
    displayedItems = searchFiltered.filter((n) => {
      const expired = isItemExpired(n);
      return n.status === 'published' && !expired && (n.type === 'news' || (!n.type && n.category !== 'advisory'));
    });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-theme pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
        >
          <ArrowLeft2 size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-heading text-text-primary">News & Advisories</h1>
          <p className="text-[10px] text-text-muted font-['Inter-Medium']">
            {activeLgu?.name || 'Municipality of Liliw'}
          </p>
        </div>

        <div className="w-9 h-9" />
      </div>

      {/* Segment Tabs: News | Advisories | Archived (1:1 with mobile NewsScreen) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-surface-alt dark:bg-chip border border-theme">
        <button
          onClick={() => setActiveSegment('news')}
          className={`py-2 rounded-xl text-xs font-['Octarine-Bold'] transition flex items-center justify-center gap-1.5 ${
            activeSegment === 'news'
              ? 'bg-accent text-accent-contrast shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <DocumentText size={16} variant="Bold" />
          <span>News</span>
        </button>

        <button
          onClick={() => setActiveSegment('advisories')}
          className={`py-2 rounded-xl text-xs font-['Octarine-Bold'] transition flex items-center justify-center gap-1.5 ${
            activeSegment === 'advisories'
              ? 'bg-accent text-accent-contrast shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Danger size={16} variant="Bold" />
          <span>Advisories</span>
        </button>

        <button
          onClick={() => setActiveSegment('archived')}
          className={`py-2 rounded-xl text-xs font-['Octarine-Bold'] transition flex items-center justify-center gap-1.5 ${
            activeSegment === 'archived'
              ? 'bg-accent text-accent-contrast shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <ArchiveBox size={16} variant="Bold" />
          <span>Archived</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchNormal1 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search news, bulletins, or advisories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted font-['Inter-Medium'] shadow-xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Item List */}
      <div className="space-y-4 pt-1">
        {loading ? (
          <SkeletonFeed count={3} />
        ) : displayedItems.length === 0 ? (
          <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-2">
            <DocumentText size={32} className="text-text-muted mx-auto" />
            <p className="text-xs text-text-muted font-['Inter-Medium']">
              No {activeSegment} bulletins found.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <article
              key={item.id}
              className="bg-surface dark:bg-card rounded-[28px] border border-theme overflow-hidden shadow-xs space-y-3 hover:border-accent transition group"
            >
              <div className="h-44 w-full overflow-hidden bg-surface-alt dark:bg-chip">
                <img
                  src={getNewsImageUrl(item)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                />
              </div>

              <div className="p-5 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status={item.type || item.category || 'News'} />
                  <span className="text-xs text-text-muted font-['Inter-Medium'] flex items-center gap-1">
                    <Calendar size={13} />
                    <span>{getRelativeTime(item.published_at || item.created_at)}</span>
                  </span>
                </div>

                <h2 className="text-base font-['Octarine-Bold'] text-text-primary leading-snug">
                  {item.title}
                </h2>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-3 font-['Inter-Medium']">
                  {item.content}
                </p>

                <div className="pt-2 border-t border-theme flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-['Inter-Medium']">
                    <ShieldSecurity size={14} variant="Bold" />
                    <span>Official Broadcast</span>
                  </div>

                  <Link
                    href={`/news/${item.id}`}
                    className="px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 transition flex items-center gap-1 shadow-xs"
                  >
                    <span>Read</span>
                    <ArrowRight2 size={13} />
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
