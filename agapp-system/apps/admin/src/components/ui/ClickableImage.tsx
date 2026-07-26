'use client';

import React, { useState } from 'react';
import { SearchZoomIn } from 'iconsax-react';
import { ImagePreviewModal } from './ImagePreviewModal';

export interface ClickableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  containerClassName?: string;
  showOverlayHint?: boolean;
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
  src,
  alt = 'Image preview',
  modalTitle,
  modalSubtitle,
  containerClassName = '',
  showOverlayHint = true,
  className = '',
  style,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div
        className={`relative group cursor-pointer overflow-hidden rounded-lg ${containerClassName}`}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
          style={style}
          {...props}
        />

        {showOverlayHint && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
              <SearchZoomIn className="w-4 h-4 text-accent" />
              <span className="font-medium">Click to view</span>
            </div>
          </div>
        )}
      </div>

      <ImagePreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={src}
        alt={alt}
        title={modalTitle || alt}
        subtitle={modalSubtitle}
      />
    </>
  );
};
