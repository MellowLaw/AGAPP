'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CloseCircle } from 'iconsax-react';

const DISMISS_KEY_SESSION = 'agapp_pwa_dismissed_session';
const DISMISS_KEY_UNTIL = 'agapp_pwa_dismissed_until';
const INSTALLED_KEY = 'agapp_pwa_installed';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  const isDismissedOrInstalled = useCallback(() => {
    if (typeof window === 'undefined') return true;

    // 1. Check if running in standalone mode (already installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    if (isStandalone) return true;

    // 2. Check if installed flag is present
    try {
      if (localStorage.getItem(INSTALLED_KEY) === 'true') return true;

      // 3. Check if dismissed in this session
      if (sessionStorage.getItem(DISMISS_KEY_SESSION) === 'true') return true;

      // 4. Check if dismissed within the 14-day cooloff period
      const dismissedUntil = localStorage.getItem(DISMISS_KEY_UNTIL);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return true;
      }
    } catch {
      // Ignore storage access errors
    }

    return false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // On localhost, aggressively unregister old service workers and purge caches to prevent stale dev bundles
    if (isLocalhost) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }

    // Fast-exit for the visual install toast if already dismissed or installed
    if (isDismissedOrInstalled()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      if (isDismissedOrInstalled()) return;
      setDeferredPrompt(e);
      // Small delay before showing toast so it doesn't pop up abruptly on page mount
      setTimeout(() => {
        if (!isDismissedOrInstalled()) {
          setShowBanner(true);
        }
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isDismissedOrInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      // Never show again in this session
      sessionStorage.setItem(DISMISS_KEY_SESSION, 'true');
      // Also suppress for 14 days
      localStorage.setItem(DISMISS_KEY_UNTIL, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem(INSTALLED_KEY, 'true');
        sessionStorage.setItem(DISMISS_KEY_SESSION, 'true');
      } else {
        handleDismiss();
      }
    } catch {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Install App Toast"
      className="fixed bottom-24 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-sm w-auto animate-fade-in pointer-events-auto"
    >
      <div
        className="bg-[#24201E]/95 text-white p-3.5 sm:p-4 rounded-[28px] shadow-[0_20px_45px_-8px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.15)_inset] backdrop-blur-2xl border border-white/15 flex items-center justify-between gap-3 transition-all"
        style={{
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src="/brand/logo.png" alt="AGAPP Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-heading text-white leading-tight">
              Install app for a better experience
            </h4>
            <p className="text-[11px] text-[#A8A29E] font-['Inter-Medium'] truncate mt-0.5">
              Quick access to services, reports & live alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3.5 py-1.5 bg-accent text-accent-contrast font-heading rounded-full text-xs hover:opacity-90 shadow-xs transition"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Dismiss"
          >
            <CloseCircle size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
