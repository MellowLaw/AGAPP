import React from 'react';
import Image from 'next/image';

interface AgappLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textClassName?: string;
}

// Wordmark always renders in Sora (loaded as --font-brand in the root layout)
// regardless of which page's body font is active, so the brand mark stays
// consistent across the Plus Jakarta Sans dashboard and the Manrope login page.
export function AgappLogo({
  size = 32,
  showText = true,
  textColor,
  textClassName = '',
}: AgappLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0 relative" style={{ width: size, height: size }}>
        <Image
          src="/agapp-icon.png"
          alt="Agapp"
          fill
          priority
          style={{ borderRadius: size * 0.22 }}
        />
      </div>
      {showText && (
        <span
          className={`font-extrabold ${textClassName}`}
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: size * 0.5,
            letterSpacing: '-0.02em',
            color: textColor || 'var(--text-primary)',
          }}
        >
          Agapp<span style={{ color: '#FF758F' }}>.</span>
        </span>
      )}
    </div>
  );
}
