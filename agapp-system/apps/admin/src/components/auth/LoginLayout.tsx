'use client';

import React from 'react';

interface LoginLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const LoginLayout: React.FC<LoginLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-xl text-[#1a1a1a]">AGAPP</span>
        </div>
        
        {/* Card */}
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">{title}</h1>
            {subtitle && (
              <p className="text-[#737373] mt-2">{subtitle}</p>
            )}
          </div>
          
          {children}
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-[#737373] mt-6">
          © 2026 AGAPP. Local Government Digital Platform.
        </p>
      </div>
    </div>
  );
};
