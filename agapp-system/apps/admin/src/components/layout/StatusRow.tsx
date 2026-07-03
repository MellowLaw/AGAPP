'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bell } from '@phosphor-icons/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function StatusRow() {
  const { isDark, toggleTheme } = useTheme();
  const now = useClock();
  const { showToast, ToastContainer } = useToast();

  // UTC+8 (Philippines) regardless of the viewer's own machine timezone.
  const timeLabel = now
    ? new Intl.DateTimeFormat('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Manila',
      }).format(now)
    : '--:--:--';

  return (
    <div className="inline-flex items-center gap-3 px-2 py-2 rounded-md">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="text-[11px] font-mono font-semibold tracking-widest text-text-muted">SYS_LIVE</span>
      </div>

      <div className="h-4 w-px bg-theme" />

      <span className="text-sm font-mono font-bold text-text-primary tabular-nums">
        {timeLabel} <span className="text-[10px] font-medium text-text-faint">UTC+8</span>
      </span>

      <div className="h-4 w-px bg-theme" />

      <motion.button
        onClick={() => showToast('Notifications panel coming soon', 'info')}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-6 h-6 text-text-muted hover:text-accent"
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full" />
      </motion.button>

      <div className="h-4 w-px bg-theme" />

      <motion.button
        onClick={toggleTheme}
        aria-label="Toggle color theme"
        className="flex items-center justify-center w-6 h-6 text-text-muted hover:text-accent"
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex"
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <ToastContainer />
    </div>
  );
}
