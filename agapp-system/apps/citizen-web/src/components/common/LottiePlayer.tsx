'use client';

import React, { useEffect, useState } from 'react';
import { Lottie } from 'lottie-react';

interface LottiePlayerProps {
  animationPath: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function LottiePlayer({
  animationPath,
  loop = true,
  autoplay = true,
  className = '',
  style = {},
}: LottiePlayerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={style}
      >
        <img
          src="/brand/mascot.png"
          alt="Loading animation"
          className="w-full h-full object-contain opacity-80"
        />
      </div>
    );
  }

  return (
    <Lottie
      src={animationPath}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}
