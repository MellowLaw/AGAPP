'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu, getLguLogo } from '../contexts/LguContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { getRelativeTime } from '../lib/timeAgo';
import { getNewsImageUrl, isItemExpired } from '../lib/newsHelpers';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { CommandSearchModal } from '../components/search/CommandSearchModal';
import { 
  Briefcase, 
  Danger, 
  Code, 
  DocumentText, 
  Messages1, 
  MessageQuestion, 
  Location, 
  Call,
  SearchNormal1,
  NotificationBing,
  ArrowRight2,
  ArrowLeft2,
  CloseCircle,
  Messages,
  Calendar,
  ShieldSecurity,
  Book
} from 'iconsax-react';

export default function CitizenHomePage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { user, profile } = useAuth();
  const { isDarkMode, T } = useTheme();

  const [activeTab, setActiveTab] = useState<'for_you' | 'community'>('for_you');
  const [allNews, setAllNews] = useState<any[]>([]);
  const [myActivity, setMyActivity] = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadingHome, setLoadingHome] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Live Command Palette Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcut (Ctrl+K or /) for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 11) return 'Magandang Umaga,';
    if (hour >= 11 && hour < 13) return 'Magandang Tanghali,';
    if (hour >= 13 && hour < 18) return 'Magandang Hapon,';
    return 'Magandang Gabi,';
  };

  const formatDateTime = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[currentDateTime.getDay()];
    const monthName = months[currentDateTime.getMonth()];
    const date = currentDateTime.getDate();
    let hours = currentDateTime.getHours();
    const minutes = currentDateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${dayName}, ${monthName} ${date} · ${hours}:${strMinutes} ${ampm}`;
  };

  // 1. Fetch official News & Announcements from Supabase
  const loadHomeData = useCallback(async () => {
    if (!activeLgu?.id) return;
    setLoadingHome(true);
    try {
      // 1. News & Announcements (published and unexpired)
      const { data: newsData } = await supabase
        .from('news_announcements')
        .select('*')
        .eq('lgu_id', activeLgu.id)
        .or('status.eq.published,and(status.eq.archived,is_public.eq.true)')
        .order('published_at', { ascending: false })
        .limit(20);

      if (newsData && newsData.length > 0) {
        const unexpired = newsData.filter((item: any) => !isItemExpired(item));

        const sorted = [...unexpired].sort((a: any, b: any) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          const typePriority = (type: string) => {
            if (type === 'advisory') return 3;
            if (type === 'announcement') return 2;
            return 1;
          };
          const diff = typePriority(b.type) - typePriority(a.type);
          if (diff !== 0) return diff;
          return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
        });

        setAllNews(sorted);
      } else {
        setAllNews([]);
      }

      // 2. User submissions activity if logged in
      if (user?.id) {
        const [reportsRes, servicesRes] = await Promise.all([
          supabase
            .from('reports')
            .select('id, reference_number, category, status, created_at')
            .eq('citizen_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('service_requests')
            .select('id, reference_number, service_type, status, created_at')
            .eq('citizen_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const combined = [
          ...(reportsRes.data || []).map((r) => ({ ...r, itemType: 'report' })),
          ...(servicesRes.data || []).map((s) => ({ ...s, itemType: 'service' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setMyActivity(combined.slice(0, 3));
      } else {
        setMyActivity([]);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoadingHome(false);
    }
  }, [activeLgu?.id, user?.id]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const quickActions = [
    { label: 'E-Services', icon: Briefcase, href: '/services' },
    { label: 'Report', icon: Danger, href: '/report' },
    { label: 'Citizen Guide', icon: Book, href: '/guides' },
    { label: 'News', icon: DocumentText, href: '/news' },
    { label: 'Verify ID', icon: ShieldSecurity, href: '/verify' },
    { label: 'Chatbot', icon: MessageQuestion, href: '/chatbot' },
    { label: 'Explore', icon: Location, href: '/map' },
    { label: 'Emergency', icon: Call, href: '/emergency' },
  ];

  // News split for Community Tab
  const announcementsOnly = allNews.filter((n) => n.type === 'announcement' || n.type === 'advisory');
  const newsOnly = allNews.filter((n) => n.type === 'news' || (!n.type && n.category !== 'advisory'));
  const activeAdvisory = allNews.find((n) => n.type === 'advisory' || n.category === 'advisory');
  const activeAnnouncement = allNews.find((n) => n.type === 'announcement');
  const alertItem = activeAdvisory || activeAnnouncement;

  const currentFeatured = allNews[carouselIndex] || allNews[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-5 pb-28 animate-fade-in transition-colors">
      {/* 1. Header Segment Tabs (For You vs Community) */}
      <div className="flex items-center gap-6 border-b border-theme/60 pb-3">
        <button
          onClick={() => setActiveTab('for_you')}
          className={`relative pb-1 text-lg sm:text-xl font-['Octarine-Bold'] transition ${
            activeTab === 'for_you'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>For You</span>
          {activeTab === 'for_you' && (
            <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`relative pb-1 text-lg sm:text-xl font-['Octarine-Bold'] transition ${
            activeTab === 'community'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>Community</span>
          {activeTab === 'community' && (
            <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* 2. Pill Search Bar & Notification Bell */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSearchModal(true)}
          className="relative flex-1 flex items-center justify-between gap-2.5 pl-4 pr-3 py-3 rounded-full bg-surface dark:bg-card border border-theme text-xs sm:text-sm text-text-muted shadow-xs text-left hover:border-accent transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <SearchNormal1 size={18} className="text-text-muted shrink-0 group-hover:text-accent transition-colors" />
            <span className="truncate">Search services, news, municipal guides...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-surface-alt dark:bg-chip border border-theme text-text-muted shrink-0">
            Ctrl K
          </kbd>
        </button>

        <Link
          href="/notifications"
          className="relative p-2 text-text-primary hover:text-accent transition shrink-0 flex items-center justify-center"
          title="Notifications"
        >
          <NotificationBing size={22} variant="Bold" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
        </Link>
      </div>

      {/* TAB 1: FOR YOU */}
      {activeTab === 'for_you' ? (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-5 lg:space-y-0">
          {/* Main Left Column (Col 1-8) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Restricted Status Banner */}
            {profile?.moderation_status === 'restricted' && (
              <Link
                href="/restricted"
                className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 font-['Octarine-Bold']"
              >
                <div className="flex items-center gap-2">
                  <Danger size={18} className="text-rose-600 shrink-0" variant="Bold" />
                  <span>Your account has temporary interaction restrictions.</span>
                </div>
                <span>View Notice &rarr;</span>
              </Link>
            )}

            {/* 4. Greeting & Location Meta Block */}
          <div className="pt-1">
            <p className="text-xs text-text-muted font-['Inter-Medium'] mb-1" suppressHydrationWarning>
              {profile?.barangay ? `${profile.barangay} · ` : 'Poblacion · '}
              {(activeLgu?.name || 'Liliw').replace(/^Municipality of\s*/i, '').replace(/,\s*Laguna/i, '')}, Laguna · <span suppressHydrationWarning>{formatDateTime()}</span>
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-['Octarine-Bold'] text-text-primary tracking-tight leading-tight" suppressHydrationWarning>
                  {getGreeting()}
                </h1>
                <div className="flex items-center gap-2 flex-nowrap mt-0.5">
                  <h1 className="text-2xl sm:text-3xl font-['Octarine-Bold'] text-text-primary tracking-tight leading-tight truncate" suppressHydrationWarning>
                    {profile?.full_name ? profile.full_name.split(' ')[0] + '!' : 'Resident!'}
                  </h1>
                  <img
                    src="/brand/mascot.png"
                    alt="AGAPP Mascot"
                    className="w-14 h-7 object-contain inline-block shrink-0 -translate-y-0.5"
                  />
                </div>
              </div>

              {/* Official Municipal Seal */}
              <Link href="/lgu-select" title="Change LGU" className="shrink-0 hover:scale-105 transition">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shadow-xs flex items-center justify-center">
                  <img
                    src={getLguLogo(activeLgu)}
                    alt={activeLgu?.name || 'Seal'}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/brand/liliw-seal.jpg';
                    }}
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* 5. "What would you like to do?" Bento Card */}
          <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-4 transition-colors">
            <h3 className="text-sm font-['Octarine-Bold'] text-text-primary pl-1">
              What would you like to do?
            </h3>

            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const quickActionIconColor = isDarkMode 
                  ? (activeLgu?.icon_color || activeLgu?.secondary_color || '#FF758F') 
                  : (activeLgu?.primary_color || '#E11D48');

                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center justify-center gap-1.5 group text-center"
                  >
                    <div className="w-14 h-14 rounded-[20px] bg-surface-alt dark:bg-[#34302C] border border-theme group-hover:border-accent group-hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-xs">
                      <Icon size={26} color={quickActionIconColor} variant="Bold" />
                    </div>
                    <span className="text-[11px] font-['Inter-Medium'] text-text-primary leading-tight">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 6. Featured Carousel Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-['Octarine-Bold'] text-text-primary">Featured Updates</h3>
              <Link href="/news" className="text-xs font-heading text-accent hover:underline">
                View all &rarr;
              </Link>
            </div>

            {loadingHome ? (
              <div className="rounded-[28px] overflow-hidden bg-surface dark:bg-card border border-theme p-4 space-y-3 shadow-xs">
                <Skeleton className="w-full h-44 sm:h-52 rounded-2xl" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ) : currentFeatured ? (
              <div className="relative rounded-[28px] overflow-hidden bg-surface dark:bg-card border border-theme shadow-xs group transition-colors">
                <div className="relative h-48 sm:h-56 w-full bg-surface-alt dark:bg-chip">
                  <img
                    src={getNewsImageUrl(currentFeatured)}
                    alt={currentFeatured.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface dark:from-card via-surface/30 dark:via-card/30 to-transparent" />

                  {allNews.length > 1 && (
                    <>
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev > 0 ? prev - 1 : allNews.length - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 dark:bg-card/80 backdrop-blur-sm shadow border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition"
                      >
                        <ArrowLeft2 size={16} />
                      </button>
                      <button
                        onClick={() => setCarouselIndex((prev) => (prev < allNews.length - 1 ? prev + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/80 dark:bg-card/80 backdrop-blur-sm shadow border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition"
                      >
                        <ArrowRight2 size={16} />
                      </button>
                    </>
                  )}
                </div>

                <div className="p-4 pt-0 space-y-2 relative -mt-6">
                  <div>
                    <StatusBadge status={currentFeatured.category || currentFeatured.type || 'NEWS'} />
                  </div>

                  <h4 className="text-sm font-['Octarine-Bold'] text-text-primary leading-snug line-clamp-2">
                    {currentFeatured.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-text-muted font-['Inter-Medium']">
                      {new Date(currentFeatured.published_at || currentFeatured.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/news/${currentFeatured.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs shadow-xs hover:opacity-90 transition"
                    >
                      <span>Read</span>
                      <ArrowRight2 size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[28px] bg-surface dark:bg-card border border-theme text-center text-xs text-text-muted">
                No featured announcements at this time.
              </div>
            )}
          </div>

          {/* 7. Activity Submissions Tracker */}
          {myActivity.length > 0 && (
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-['Octarine-Bold'] text-text-primary">Recent Activity</h3>
                <Link href="/tracking" className="text-xs font-heading text-accent hover:underline">
                  View all &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                {myActivity.map((act) => (
                  <Link
                    key={act.id}
                    href={`/tracking/${act.itemType}/${act.id}`}
                    className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-between hover:border-accent transition-colors"
                  >
                    <div>
                      <span className="text-xs font-heading text-text-primary block">
                        {act.itemType === 'report' ? `Incident: ${act.category}` : `Request: ${act.service_type || 'E-Service'}`}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        Ref #{act.reference_number} · {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge status={act.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Right Rail Column (Col 9-12) - Visible as full column on desktop */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-6">
            {/* 1. Advisory Alert Banner */}
            {alertItem && (
              <Link
                href={`/news/${alertItem.id}`}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs group text-left transition ${
                  alertItem.type === 'advisory'
                    ? 'bg-[#FFF1F2] dark:bg-red-950/40 border-[#FECDD3] dark:border-red-900/60 hover:bg-[#FFE4E6]'
                    : 'bg-surface-alt dark:bg-chip border-theme hover:border-accent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pl-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-white font-['Octarine-Bold'] text-[9px] uppercase tracking-wider shrink-0 shadow-2xs ${
                    alertItem.type === 'advisory' ? 'bg-[#EF4444]' : 'bg-[#D97706]'
                  }`}>
                    {alertItem.type === 'advisory' ? 'ADVISORY!' : 'ANNOUNCEMENT!'}
                  </span>
                  <span className={`text-xs font-['Inter-Medium'] truncate ${
                    alertItem.type === 'advisory' ? 'text-[#991B1B] dark:text-red-300' : 'text-text-primary'
                  }`}>
                    {alertItem.title}
                  </span>
                </div>
                <ArrowRight2 size={16} className={`shrink-0 pr-1 transition group-hover:translate-x-0.5 ${
                  alertItem.type === 'advisory' ? 'text-[#EF4444]' : 'text-text-muted'
                }`} />
              </Link>
            )}

            {/* 2. Interactive Town Map Quick Card */}
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-['Octarine-Bold'] uppercase">
                  Interactive Map
                </span>
                <span className="text-[11px] text-text-muted font-['Inter-Medium']">
                  {(activeLgu?.name || 'Liliw').replace(/^Municipality of\s*/i, '')}
                </span>
              </div>

              <h4 className="text-sm font-['Octarine-Bold'] text-text-primary leading-snug">
                Municipal Hall & Town Facilities
              </h4>

              <p className="text-xs text-text-muted leading-relaxed font-['Inter-Medium']">
                View evacuation centers, emergency posts, barangay halls, and public landmarks on the map.
              </p>

              <div className="pt-2 border-t border-theme flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-text-muted font-['Inter-Medium']">
                  <Location size={16} className="text-accent" variant="Bold" />
                  <span>Public Navigation</span>
                </div>

                <Link
                  href="/map"
                  className="text-xs font-['Octarine-Bold'] text-accent hover:underline flex items-center gap-1"
                >
                  <span>Explore Town Map</span>
                  <ArrowRight2 size={14} />
                </Link>
              </div>
            </div>

            {/* 3. Municipal Quick Links & Emergency Hotlines */}
            <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-['Octarine-Bold'] text-text-primary">Emergency Hotlines</h3>
                <Link href="/emergency" className="text-xs font-heading text-accent hover:underline">
                  Full list &rarr;
                </Link>
              </div>

              <div className="space-y-2">
                <a
                  href="tel:911"
                  className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-between hover:border-accent transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                      <Call size={20} variant="Bold" />
                    </div>
                    <div>
                      <p className="text-xs font-['Octarine-Bold'] text-text-primary">MDRRMO / Rescue</p>
                      <p className="text-[10px] text-text-muted font-['Inter-Medium']">24/7 Disaster Response</p>
                    </div>
                  </div>
                  <span className="text-xs font-['Octarine-Bold'] text-accent group-hover:underline">Call 911</span>
                </a>

                <Link
                  href="/guides"
                  className="p-3 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-between hover:border-accent transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                      <Book size={20} variant="Bold" />
                    </div>
                    <div>
                      <p className="text-xs font-['Octarine-Bold'] text-text-primary">Citizen's Charter</p>
                      <p className="text-[10px] text-text-muted font-['Inter-Medium']">Processing times & fees</p>
                    </div>
                  </div>
                  <ArrowRight2 size={14} className="text-text-muted group-hover:text-accent transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: COMMUNITY (Matching Mobile HomeScreen Community Tab) */
        <div className="space-y-5">
          {loadingHome ? (
            <div className="space-y-4">
              <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-9 w-full rounded-full mt-2" />
              </div>
              <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <Skeleton className="h-5 w-2/3 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-md" />
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Official Announcements */}
              {announcementsOnly.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-['Octarine-Bold'] text-text-primary">Official Announcements</h3>
                  {announcementsOnly.map((item) => (
                    <article
                      key={item.id}
                      className="bg-surface dark:bg-card rounded-[28px] border border-theme p-5 shadow-xs space-y-3 hover:border-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge status={item.type || 'Announcement'} />
                        <span className="text-xs text-text-muted font-['Inter-Medium']">
                          {new Date(item.published_at || item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h4 className="text-base font-['Octarine-Bold'] text-text-primary leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3 font-['Inter-Medium']">
                        {item.content}
                      </p>

                      <div className="pt-1">
                        <Link
                          href={`/news/${item.id}`}
                          className="w-full py-2.5 rounded-full bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>Read Full Notice</span>
                          <ArrowRight2 size={14} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Section 2: News Feed */}
              <div className="space-y-3">
                <h3 className="text-base font-['Octarine-Bold'] text-text-primary">News Feed</h3>

                {newsOnly.length === 0 ? (
                  <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-8 text-center text-xs text-text-muted">
                    No feed articles published yet.
                  </div>
                ) : (
                  newsOnly.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface dark:bg-card rounded-[28px] border border-theme overflow-hidden shadow-xs space-y-4 hover:border-accent transition-colors"
                    >
                      <div className="h-48 w-full overflow-hidden bg-surface-alt dark:bg-chip">
                        <img
                          src={getNewsImageUrl(item)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-5 pt-0 space-y-2">
                        <div className="flex items-center justify-between pt-4">
                          <StatusBadge status={item.category || item.type || 'News'} />
                          <span className="text-xs text-text-muted font-['Inter-Medium']">
                            {new Date(item.published_at || item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <h4 className="text-base font-['Octarine-Bold'] text-text-primary leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-xs text-text-muted leading-relaxed line-clamp-3 font-['Inter-Medium']">
                          {item.content}
                        </p>

                        <div className="pt-2">
                          <Link
                            href={`/news/${item.id}`}
                            className="w-full py-2.5 rounded-full bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Read Full Article</span>
                            <ArrowRight2 size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Universal Command Palette / Omni Search Modal */}
      <CommandSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  );
}
