'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useLgu } from '../../../contexts/LguContext';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { getNewsImageUrl, getDocumentAttachments } from '../../../lib/newsHelpers';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { 
  ArrowLeft2, 
  Heart, 
  DocumentText, 
  Calendar, 
  Share, 
  Location, 
  ArrowRight2,
  Clock
} from 'iconsax-react';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params?.id as string;
  const { user, profile } = useAuth();
  const { activeLgu } = useLgu();
  const { showToast } = useToast();

  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);

  useEffect(() => {
    if (!newsId) return;

    async function fetchArticle() {
      setLoading(true);
      try {
        // Fetch article
        const { data, error } = await supabase
          .from('news_announcements')
          .select('*')
          .eq('id', newsId)
          .single();

        if (data) {
          setNews(data);
        } else {
          // Fallback mock
          setNews({
            id: newsId,
            title: 'Liliw Footwear Artisans Adopt Green Practices to Elevate Local Craftsmanship',
            category: 'NEWS',
            created_at: '2026-07-20T10:00:00Z',
            image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
            content: `LILIW, LAGUNA — Local shoemakers along the famous Gat Tayaw Street are breathing new life into the town’s iconic footwear industry by adopting eco-friendly manufacturing methods. Long celebrated as the Footwear Capital of Laguna, Liliw is taking proactive steps to combine traditional artisanal shoe-crafting with sustainable, biodegradable materials.\n\nMunicipal Mayor and BPLO officers inaugurated the Green Footwear Training Initiative, offering workshops on water-based non-toxic adhesives, sustainable cork insoles, and recycled rubber outsoles.\n\nResidents and local shop owners are encouraged to participate in the upcoming Tsinelas Festival Innovation Showcase scheduled for next month.`,
            attachment_url: null,
          });
        }

        // Fetch DB like reactions count
        try {
          const { count } = await supabase
            .from('news_reactions')
            .select('news_id', { count: 'exact', head: true })
            .eq('news_id', newsId);
          if (count !== null && count !== undefined) setLikeCount(count);
        } catch (e) {
          console.warn('news_reactions query failed:', e);
        }

        // Check if current user liked
        if (user?.id) {
          const { data: reactionData } = await supabase
            .from('news_reactions')
            .select('user_id')
            .eq('news_id', newsId)
            .eq('user_id', user.id)
            .maybeSingle();
          setIsLiked(!!reactionData);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('agapp_liked_news');
          if (stored) {
            const arr = JSON.parse(stored);
            setIsLiked(arr.includes(newsId));
          }
        }

        // Fetch related news
        const { data: relData } = await supabase
          .from('news_announcements')
          .select('*')
          .eq('lgu_id', activeLgu?.id || 'liliw-laguna')
          .neq('id', newsId)
          .limit(2);
        if (relData) setRelatedNews(relData);
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [newsId, user?.id, activeLgu?.id]);

  const handleToggleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    if (user?.id) {
      try {
        if (nextState) {
          await supabase.from('news_reactions').insert({ news_id: newsId, user_id: user.id });
        } else {
          await supabase.from('news_reactions').delete().eq('news_id', newsId).eq('user_id', user.id);
        }
      } catch (err) {
        console.error('Error updating reaction:', err);
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agapp_liked_news');
      let arr: string[] = stored ? JSON.parse(stored) : [];
      if (nextState) {
        arr.push(newsId);
      } else {
        arr = arr.filter((id) => id !== newsId);
      }
      localStorage.setItem('agapp_liked_news', JSON.stringify(arr));
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: news?.title,
        text: `Official Advisory from ${activeLgu?.name || 'AGAPP'}: ${news?.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-28">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/news" className="inline-flex items-center text-text-primary hover:opacity-70 transition font-heading text-xs">
          <ArrowLeft2 size={18} className="mr-1" />
          <span>Back to News</span>
        </Link>
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-surface dark:bg-card border border-theme text-text-primary hover:bg-surface-alt dark:hover:bg-chip transition shadow-xs"
        >
          <Share size={16} />
        </button>
      </div>

      {loading || !news ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface dark:bg-card rounded-[32px] border border-theme">
          Loading official publication...
        </div>
      ) : (
        <div className="bg-surface dark:bg-card rounded-[32px] border border-theme overflow-hidden shadow-sm space-y-5 transition-colors">
          {/* Cover Hero Image */}
          <div className="h-64 sm:h-72 w-full overflow-hidden relative bg-surface-alt dark:bg-chip">
            <img
              src={getNewsImageUrl(news)}
              alt={news.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={news.category || news.type || 'Official Bulletin'} />
            </div>
          </div>

          {/* Article Header & Meta */}
          <div className="px-6 sm:px-8 space-y-3">
            <h1 className="text-xl sm:text-2xl font-heading text-text-primary leading-snug">
              {news.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-text-muted border-b border-theme pb-4">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-accent" />
                <span>{new Date(news.published_at || news.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </span>
              <span className="flex items-center gap-1">
                <Location size={14} className="text-accent" />
                <span>{activeLgu?.name || 'Liliw, Laguna'}</span>
              </span>
            </div>

            {/* Article Content */}
            <div className="prose prose-sm max-w-none text-text-muted leading-relaxed whitespace-pre-line py-2 text-xs sm:text-sm">
              {news.content}
            </div>

            {/* Official Document Attachments if present */}
            {getDocumentAttachments(news).map((doc, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocumentText size={20} className="text-accent" />
                  <span className="text-xs font-heading text-text-primary">{doc.name || 'Official Document Attachment'}</span>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-heading hover:opacity-90 transition shadow-xs"
                >
                  Download PDF
                </a>
              </div>
            ))}

            {/* Like Reaction Toggle */}
            <div className="pt-4 border-t border-theme flex items-center justify-between">
              <button
                onClick={handleToggleLike}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition shadow-xs ${
                  isLiked
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-heading'
                    : 'bg-surface-alt dark:bg-chip border border-theme text-text-muted hover:text-red-500'
                }`}
              >
                <Heart size={18} variant={isLiked ? 'Bold' : 'Outline'} className={isLiked ? 'text-red-600 dark:text-red-400' : ''} />
                <span className="text-xs">{likeCount} Helpful Recommends</span>
              </button>

              <span className="text-[10px] text-text-muted">
                Official Municipal Press Release
              </span>
            </div>
          </div>

          {/* Related Articles Carousel */}
          {relatedNews.length > 0 && (
            <div className="p-6 bg-surface-alt dark:bg-chip/50 border-t border-theme space-y-3">
              <span className="text-xs font-heading uppercase tracking-wider text-text-primary block">
                Related Advisories
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedNews.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.id}`}
                    className="p-3.5 rounded-2xl bg-surface dark:bg-card border border-theme hover:border-accent transition block space-y-1"
                  >
                    <span className="text-[9px] font-heading uppercase text-accent block">
                      {rel.category || 'Advisory'}
                    </span>
                    <h4 className="text-xs font-heading text-text-primary line-clamp-2">
                      {rel.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
