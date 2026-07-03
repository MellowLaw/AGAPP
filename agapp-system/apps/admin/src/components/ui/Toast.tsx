'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Warning, Info } from '@phosphor-icons/react';

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
    success: <CheckCircle className="w-5 h-5 text-[#16a34a]" />,
    error: <Warning className="w-5 h-5 text-[#dc2626]" />,
    info: <Info className="w-5 h-5 text-[#2563eb]" />,
  };

  const bgColors = {
    success: 'bg-[#dcfce7] border-[#16a34a]',
    error: 'bg-[#fee2e2] border-[#dc2626]',
    info: 'bg-[#dbeafe] border-[#2563eb]',
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        transition-all duration-300
        ${bgColors[type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {icons[type]}
      <span className="text-sm font-medium text-text-primary">{message}</span>
      <button onClick={() => setIsVisible(false)} className="ml-2">
        <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
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
