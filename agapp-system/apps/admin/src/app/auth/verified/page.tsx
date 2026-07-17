'use client';

import { AgappLogo } from '@/components/ui/AgappLogo';
import { TickCircle } from 'iconsax-react';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-16 bg-[#0E0F11] text-[#F3F4F6]">
      {/* Blurred decorative glowing background */}
      <div className="absolute w-[300px] h-[300px] bg-[#22C55E]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] flex flex-col items-center text-center relative z-10">
        <div className="mb-10">
          <AgappLogo size={42} />
        </div>

        {/* Card wrapper */}
        <div className="w-full bg-[#181A1F] border border-[#262930] rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mb-6 border border-[#22C55E]/20">
            <TickCircle className="w-9 h-9 text-[#22C55E]" variant="Bold" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
            Email Confirmed!
          </h1>
          
          <p className="text-[14px] leading-relaxed text-[#9CA3AF] mb-8">
            Your email address has been successfully verified. Your AGAPP account is now fully active and ready to use.
          </p>

          <div className="w-full py-4 px-5 bg-[#1F222A] rounded-xl border border-[#2D313C] text-left">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Next Steps
            </h2>
            <p className="text-[13px] leading-relaxed text-[#9CA3AF]">
              Please return to the <span className="font-semibold text-white">AGAPP Mobile App</span> on your mobile device and sign in with your credentials to access e-services, report incidents, and view announcements.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#6B7280] mt-8">
          © {new Date().getFullYear()} AGAPP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
