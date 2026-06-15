import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-[#737373] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2
            bg-white border rounded-md
            text-[#1a1a1a] placeholder-[#a3a3a3]
            focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]
            disabled:bg-[#f5f5f5] disabled:cursor-not-allowed
            ${error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]' : 'border-[#e5e5e5]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-[#dc2626]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[#737373]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-[#737373] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2
            bg-white border rounded-md
            text-[#1a1a1a] placeholder-[#a3a3a3]
            focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]
            disabled:bg-[#f5f5f5] disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]' : 'border-[#e5e5e5]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-[#dc2626]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[#737373]">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
