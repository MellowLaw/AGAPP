import React from 'react';

interface AgappLogoProps {
  size?: number;
  textColor?: string;
  bgColor?: string;
  showText?: boolean;
}

export function AgappLogo({
  size = 32,
  textColor = '#FFFFFF',
  bgColor = '#1A1A1A',
  showText = true,
}: AgappLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center justify-center font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: size * 0.2,
          fontSize: size * 0.45,
        }}
      >
        A
      </div>
      {showText && (
        <span 
          className="font-semibold" 
          style={{ 
            fontSize: size * 0.55, 
            letterSpacing: '0.5px',
            color: bgColor === '#FFFFFF' ? '#FFFFFF' : '#1A1A1A'
          }}
        >
          AGAPP
        </span>
      )}
    </div>
  );
}
