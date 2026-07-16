'use client';

import React, { useEffect, useState } from 'react';
import { CloseCircle, TickCircle, Danger, InfoCircle } from 'iconsax-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <TickCircle className="w-5 h-5 text-[#22c55e]" variant="Bold" />,
    error: <Danger className="w-5 h-5 text-[#ef4444]" variant="Bold" />,
    info: <InfoCircle className="w-5 h-5 text-[#3b82f6]" variant="Bold" />,
  };

  const borderColors = {
    success: 'border-[#22c55e]/30 dark:border-[#22c55e]/25',
    error: 'border-[#ef4444]/30 dark:border-[#ef4444]/25',
    info: 'border-[#3b82f6]/30 dark:border-[#3b82f6]/25',
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl
        bg-surface-alt/90 backdrop-blur-md transition-all duration-300
        ${borderColors[type]}
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}
    >
      {icons[type]}
      <span className="text-xs font-semibold text-text-primary">{message}</span>
      <button onClick={() => setIsVisible(false)} className="ml-3 hover:opacity-80 transition-opacity">
        <CloseCircle className="w-4.5 h-4.5 text-text-muted hover:text-text-primary" />
      </button>
    </div>
  );
};

// Toast container hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};
