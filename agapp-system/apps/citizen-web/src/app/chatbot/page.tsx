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
import { LottiePlayer } from '../../components/common/LottiePlayer';

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
    'How do I apply for a business permit?',
    'How much is a cedula?',
    'How do I get a barangay clearance?',
    'How do I report a pothole?',
    'What are the office hours of the Municipal Hall?',
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

    const historyContext = messages.slice(-4).map((msg) => ({
      sender: msg.sender,
      text: msg.text,
    }));

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: text.trim(),
          lguId: activeLgu?.id || 'liliw-laguna',
          history: historyContext,
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
        text: `Hi! I'm your AGAPP assistant. Ask me about document applications, permits, or community concerns.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="relative min-h-screen bg-bg text-text-primary flex flex-col justify-between animate-fade-in">
      {/* Tinted Background Map Texture Matching Mobile */}
      <img
        src="/brand/bg-map-1.png"
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0 select-none"
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 h-screen flex flex-col justify-between space-y-4">
        {/* Header Bar matching mobile ChatbotScreen */}
        <div className="flex items-center justify-between border-b border-theme pb-3 bg-surface/90 dark:bg-card/90 backdrop-blur-md sticky top-0 z-20 px-3 py-2 rounded-2xl transition-colors shadow-2xs">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft2 size={18} />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-['Octarine-Bold'] text-text-primary">AGAPP Municipal Assistant</h1>
            <p className="text-[10px] text-text-muted font-['Inter-Medium']">AI Citizen Service Navigator · {lguName}</p>
          </div>

          {messages.length > 1 ? (
            <button
              onClick={handleReset}
              title="Restart Conversation"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-[11px] font-['Octarine-Bold'] text-text-muted hover:text-text-primary hover:bg-surface transition shadow-2xs cursor-pointer"
            >
              <Refresh size={13} variant="Bold" />
              <span>Reset</span>
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>

        {/* Chat Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 scroll-smooth">
          {/* Welcome State when no questions asked yet (1:1 with mobile) */}
          {messages.length === 1 && (
            <div className="py-6 space-y-5 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl font-['Octarine-Bold'] text-text-primary leading-tight">
                What is on your mind today?
              </h2>

              {/* Suggestions Grid (2-column on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {[
                  'How do I apply for a business permit?',
                  'How much is a cedula?',
                  'How do I get a barangay clearance?',
                  'How do I report a pothole or road hazard?',
                  'What are the office hours of the Municipal Hall?',
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item)}
                    className="p-4 rounded-[22px] bg-surface dark:bg-card border border-theme hover:border-accent hover:shadow-md transition text-left active:scale-[0.98] shadow-2xs cursor-pointer group"
                  >
                    <p className="text-xs sm:text-sm font-['Inter-Medium'] text-text-primary group-hover:text-accent transition-colors leading-snug">
                      {item}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Stream */}
          {messages.map((m, idx) => {
            if (m.sender === 'user') {
              return (
                <div key={m.id} className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] sm:max-w-[78%] rounded-[20px] px-4 py-2.5 bg-surface-alt dark:bg-card border border-theme text-text-primary shadow-xs">
                    <p className="text-[15px] leading-relaxed font-['Inter-Medium']">
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            } else {
              const RedirectIcon = m.redirect?.screen ? getRedirectIcon(m.redirect.screen) : null;
              const redirectHref = m.redirect?.screen ? getRedirectHref(m.redirect.screen) : '/';

              return (
                <div key={m.id} className="flex flex-col items-start w-full mb-6 animate-fade-in">
                  {/* Animated Lottie Robot Mascot from Mobile */}
                  <div className="w-[110px] h-[110px] -mb-5 -ml-3 select-none pointer-events-none">
                    <LottiePlayer
                      animationPath="/brand/chatbot-message.json"
                      loop={idx === messages.length - 1}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="w-full pl-1 space-y-2">
                    {idx === 0 ? (
                      <p className="text-[15px] leading-relaxed font-['Inter-Medium'] text-text-primary">
                        {m.text}
                      </p>
                    ) : (
                      <TypeWriterText text={m.text} />
                    )}

                    {/* Embedded Action Redirect Card (Matching Mobile 1:1) */}
                    {m.redirect && m.redirect.label && RedirectIcon && (
                      <Link
                        href={redirectHref}
                        className="flex items-center px-4 py-3 rounded-[20px] border border-theme bg-surface dark:bg-card hover:border-accent hover:shadow-md transition-all duration-200 shadow-xs group active:scale-[0.98] w-full"
                      >
                        <RedirectIcon size={18} variant="Bold" className="text-accent mr-2 shrink-0" />
                        <span className="text-[13px] font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition-colors flex-1 truncate">
                          {m.redirect.label}
                        </span>
                        <ArrowRight2 size={16} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </Link>
                    )}

                    {m.source && (
                      <span className="text-[11px] block text-text-muted italic pt-1">
                        {m.source}
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          })}

          {/* Thinking Indicator matching mobile */}
          {loading && (
            <div className="flex flex-col items-start w-full mb-6 animate-fade-in">
              <div className="w-[110px] h-[110px] -mb-5 -ml-3 select-none pointer-events-none opacity-80">
                <LottiePlayer
                  animationPath="/brand/chatbot-message.json"
                  loop={true}
                  className="w-full h-full"
                />
              </div>
              <div className="w-full pl-2">
                <p className="text-[13px] text-text-muted font-['Inter-Medium'] italic">
                  Thinking...
                </p>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Suggestion Chips & Message Input */}
        <div className="space-y-2 pt-2 bg-surface/90 dark:bg-card/90 backdrop-blur-sm sticky bottom-0 z-20 transition-colors pb-1">
          {/* Slim Horizontal Quick Suggestions Bar when in conversation (matching mobile) */}
          {messages.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3 py-1.5 rounded-full bg-surface dark:bg-card border border-theme text-[11px] font-['Octarine-Bold'] text-text-muted hover:text-text-primary hover:border-accent whitespace-nowrap transition shadow-2xs shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

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
    </div>
  );
}
