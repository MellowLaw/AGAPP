'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { TickCircle, Danger, InfoCircle, CloseCircle } from 'iconsax-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    nextId.current += 1;
    const id = nextId.current;
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setToast({ id, message, variant });

    hideTimer.current = setTimeout(() => {
      dismiss();
    }, 3200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pointer-events-auto animate-fade-in">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md transition-all ${
              toast.variant === 'success'
                ? 'bg-emerald-950/90 text-white border-emerald-500/40'
                : toast.variant === 'error'
                ? 'bg-rose-950/90 text-white border-rose-500/40'
                : 'bg-stone-900/90 text-white border-stone-700/50'
            }`}
          >
            <div className="shrink-0">
              {toast.variant === 'success' && (
                <TickCircle size={20} variant="Bold" className="text-emerald-400" />
              )}
              {toast.variant === 'error' && (
                <Danger size={20} variant="Bold" className="text-rose-400" />
              )}
              {toast.variant === 'info' && (
                <InfoCircle size={20} variant="Bold" className="text-amber-400" />
              )}
            </div>

            <p className="text-xs font-['Inter-Medium'] flex-1 leading-snug">
              {toast.message}
            </p>

            <button
              onClick={dismiss}
              className="text-white/60 hover:text-white shrink-0 p-1"
            >
              <CloseCircle size={16} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
