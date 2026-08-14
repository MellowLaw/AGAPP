'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft2, 
  Refresh, 
  ArrowUp, 
  Camera, 
  Category2, 
  Location, 
  People, 
  User, 
  Discover, 
  ArrowRight2,
  Messages1,
  InfoCircle,
  Book,
  Call,
  ShieldTick,
  NotificationBing
} from 'iconsax-react';

interface ChatRedirect {
  screen: string;
  label: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  source?: string;
  redirect?: ChatRedirect | null;
  timestamp: string;
  isNew?: boolean;
}

function TypeWriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const step = Math.max(1, Math.floor(text.length / 50));
    const interval = setInterval(() => {
      i += step;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-text-primary">{displayedText || ' '}</p>;
}

export default function ChatbotPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { user } = useAuth();

  const lguName = activeLgu?.name?.replace(/^Municipality of\s*/i, '') || 'Liliw';

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'bot',
      text: `Hi! I'm your AGAPP assistant for the Municipality of ${lguName}. Ask me about document applications, permits, or community concerns.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Requirements for Barangay Clearance',
    'How to report a pothole or road damage',
    'Business Permit renewal process',
    'Municipal Hall office hours & hotlines',
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getRedirectIcon = (screen: string) => {
    const s = (screen || '').toLowerCase().trim();
    if (s.includes('report') || s.includes('camera')) return Camera;
    if (s.includes('service') || s.includes('clearance') || s.includes('permit') || s.includes('category')) return Category2;
    if (s.includes('map') || s.includes('explore') || s.includes('location')) return Location;
    if (s.includes('forum') || s.includes('community') || s.includes('people')) return People;
    if (s.includes('profile') || s.includes('account') || s.includes('user')) return User;
    if (s.includes('verify') || s.includes('verification')) return ShieldTick;
    if (s.includes('guide') || s.includes('charter')) return Book;
    if (s.includes('emergency') || s.includes('hotline') || s.includes('call')) return Call;
    if (s.includes('notification')) return NotificationBing;
    return Discover;
  };

  const getRedirectHref = (screen: string) => {
    const s = (screen || '').toLowerCase().trim();
    if (s.includes('report')) return '/report';
    if (s.includes('service') || s.includes('clearance') || s.includes('permit')) return '/services';
    if (s.includes('map') || s.includes('explore') || s.includes('location')) return '/map';
    if (s.includes('forum') || s.includes('community')) return '/forum';
    if (s.includes('profile') || s.includes('account')) return '/profile';
    if (s.includes('verify') || s.includes('verification')) return '/verify';
    if (s.includes('guide') || s.includes('charter')) return '/guides';
    if (s.includes('emergency') || s.includes('hotline')) return '/emergency';
    if (s.includes('notification')) return '/notifications';
    if (s.includes('news')) return '/news';
    return '/';
  };

  const fallbackFaqMatch = async (queryText: string) => {
    const qLower = queryText.toLowerCase().trim();
    const isTagalog = /[\b](po|opo|saan|paano|ano|kailan|magkano|nasaan|sira|lubak|barado|baha|kumuha|tulong)[\b]/i.test(qLower);
    
    if (qLower.includes('clearance') || qLower.includes('cedula') || qLower.includes('indigency') || qLower.includes('permit') || qLower.includes('sedula')) {
      return {
        answer: isTagalog
          ? `Para sa mga clearance, sedula, at dokumento sa ${lguName}, maaari po kayong mag-apply online gamit ang inyong account at makakakuha kayo ng instant Claim QR Pass.`
          : `For clearances and permits in ${lguName}, you can submit your application online with your verified resident profile and receive an instant Claim QR Pass.`,
        source: 'AGAPP Knowledge Base',
        redirect: { screen: 'ServicesTab', label: isTagalog ? 'Pumunta sa E-Services' : 'Go to Services' },
      };
    } else if (qLower.includes('pothole') || qLower.includes('drainage') || qLower.includes('stray') || qLower.includes('damage') || qLower.includes('report') || qLower.includes('lubak') || qLower.includes('barado')) {
      return {
        answer: isTagalog
          ? `Maaari po kayong magsumite ng official community incident report kasama ang litrato at GPS location para maaksyunan agad ng engineering desk sa ${lguName}.`
          : `You can submit an official community report with photo evidence and GPS location for rapid assessment by ${lguName} field engineers.`,
        source: 'AGAPP Public Safety Directory',
        redirect: { screen: 'ReportsTab', label: isTagalog ? 'Magsumite ng Ulat' : 'Submit a Report' },
      };
    }

    return {
      answer: isTagalog
        ? `Nais niyo po bang malaman ang tungkol sa mga serbisyo ng ${lguName}, mga permit at clearances, o magsumite ng ulat ng problema sa inyong barangay?`
        : `Would you like information on ${lguName} municipal services, document applications, or submitting a public infrastructure hazard report?`,
      source: `Municipality of ${lguName} General Directory`,
      redirect: { screen: 'ServicesTab', label: isTagalog ? 'Tingnan ang Mga Serbisyo' : 'Browse All Services' },
    };
  };

  const handleSendMessage = async (customText?: string) => {
    const text = customText || chatInput;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setChatInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          lgu_id: activeLgu?.id || 'liliw-laguna',
          user_id: user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: data.answer || "I'm having trouble understanding right now.",
            source: data.source || null,
            redirect: data.redirect || null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNew: true,
          },
        ]);
      } else {
        throw new Error();
      }
    } catch (err) {
      const fallback = await fallbackFaqMatch(text.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: fallback.answer,
          source: fallback.source,
          redirect: fallback.redirect,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isNew: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'msg-0',
        sender: 'bot',
        text: `Hi! I'm your AGAPP assistant for the Municipality of ${lguName}. Ask me about document applications, permits, or community concerns.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col justify-between space-y-3 animate-fade-in pb-20">
      {/* Header matching mobile ChatbotScreen */}
      <div className="flex items-center justify-between border-b border-theme pb-3 bg-surface/80 dark:bg-card/80 backdrop-blur-md sticky top-0 z-10 px-1 transition-colors">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
        >
          <ArrowLeft2 size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-contrast border border-theme p-1 flex items-center justify-center shadow-xs">
            <Messages1 size={18} variant="Bold" />
          </div>
          <div>
            <h1 className="text-xs font-heading text-text-primary leading-tight">AGAPP Assistant</h1>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-['Inter-Medium'] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online · {lguName}
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          title="Restart Conversation"
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
        >
          <Refresh size={18} />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => {
          const isBot = m.sender === 'bot';
          const RedirectIcon = m.redirect?.screen ? getRedirectIcon(m.redirect.screen) : Discover;
          const redirectHref = m.redirect?.screen ? getRedirectHref(m.redirect.screen) : '/';

          return (
            <div
              key={m.id}
              className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-[24px] p-4 space-y-2 shadow-xs ${
                  isBot
                    ? 'bg-surface-alt dark:bg-chip border border-theme text-text-primary rounded-bl-none'
                    : 'bg-accent text-accent-contrast rounded-br-none'
                }`}
              >
                {isBot && m.isNew ? (
                  <TypeWriterText text={m.text} />
                ) : (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-['Inter-Medium']">
                    {m.text}
                  </p>
                )}

                {/* Embedded Action Redirect Card (Fully Interactive Link) */}
                {isBot && m.redirect && m.redirect.label && (
                  <Link
                    href={redirectHref}
                    className="mt-2.5 p-3.5 rounded-2xl bg-surface dark:bg-card border border-theme hover:border-accent hover:shadow-md transition-all duration-200 flex items-center justify-between shadow-xs block group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-accent-contrast transition">
                        <RedirectIcon size={20} variant="Bold" />
                      </div>
                      <span className="text-xs font-heading text-text-primary group-hover:text-accent transition-colors">
                        {m.redirect.label}
                      </span>
                    </div>
                    <ArrowRight2 size={18} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {isBot && m.source && (
                  <span className="text-[10px] block text-text-muted italic pt-1 border-t border-theme">
                    {m.source}
                  </span>
                )}

                <span
                  className={`text-[9px] block text-right font-mono ${
                    isBot ? 'text-text-muted' : 'text-accent-contrast/70'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {loading && (
          <div className="flex justify-start items-center gap-2 text-xs text-text-muted font-['Inter-Medium'] italic py-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Assistant is thinking...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips & Message Input */}
      <div className="space-y-2 pt-1 bg-surface/90 dark:bg-card/90 backdrop-blur-sm sticky bottom-0 z-10 transition-colors">
        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-[11px] font-heading text-text-muted hover:text-text-primary hover:border-accent whitespace-nowrap transition shadow-2xs shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about clearances, reports, or permits..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-['Inter-Medium'] shadow-xs transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || loading}
            className="w-11 h-11 rounded-full bg-accent text-accent-contrast border border-theme flex items-center justify-center font-heading hover:opacity-90 transition disabled:opacity-40 shadow-xs shrink-0 cursor-pointer"
          >
            <ArrowUp size={18} variant="Bold" />
          </button>
        </form>
      </div>
    </div>
  );
}
