'use client';

import React, { useEffect, useState } from 'react';
import { CloseCircle, Add, Minus, RotateRight, Export, DocumentDownload, Eye } from 'iconsax-react';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  src,
  alt = 'Image preview',
  title = 'Image Preview',
  subtitle,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Reset zoom/rotation when opened
      setZoom(1);
      setRotation(0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = title ? `${title.replace(/\s+/g, '-').toLowerCase()}.jpg` : 'image-preview.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn">
      {/* Dark backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl h-[85vh] bg-surface/95 border border-theme rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme bg-surface/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text-primary truncate">{title}</h3>
              {subtitle && <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-alt/80 border border-theme rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors disabled:opacity-40"
                title="Zoom Out (-)"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-text-primary px-2 min-w-[45px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors disabled:opacity-40"
                title="Zoom In (+)"
              >
                <Add className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-theme mx-0.5" />
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
                title="Rotate 90°"
              >
                <RotateRight className="w-4 h-4" />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors font-medium"
                  title="Reset view"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-theme mx-1" />

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2 text-text-muted hover:text-accent hover:bg-surface-alt rounded-xl border border-transparent hover:border-theme transition-colors"
              title="Open full image in new tab"
            >
              <Export className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-text-muted hover:text-accent hover:bg-surface-alt rounded-xl border border-transparent hover:border-theme transition-colors"
              title="Download image"
            >
              <DocumentDownload className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors ml-1"
              title="Close (Esc)"
            >
              <CloseCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport / Image display */}
        <div 
          className="relative flex-1 bg-black/60 flex items-center justify-center overflow-auto p-4 select-none cursor-grab active:cursor-grabbing"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all"
            draggable={false}
          />
        </div>

        {/* Footer info badge */}
        <div className="px-6 py-2.5 border-t border-theme bg-surface/80 text-xs text-text-muted flex items-center justify-between shrink-0">
          <span>Click outside or press <kbd className="px-1.5 py-0.5 bg-surface-alt border border-theme rounded text-[10px] font-mono">ESC</kbd> to close</span>
          <span className="font-mono text-[11px]">Clickable Image Preview</span>
        </div>
      </div>
    </div>
  );
};
