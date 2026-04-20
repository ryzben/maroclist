"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  alt: string;
}

export default function ImageLightbox({ images, alt }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prev, next]);

  return (
    <>
      {/* Gallery */}
      <div className="space-y-2">
        <div
          className="relative h-80 w-full cursor-zoom-in overflow-hidden rounded-xl sm:h-96"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={images[activeIndex]}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 end-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative h-20 cursor-pointer overflow-hidden rounded-lg border-2 transition ${
                  activeIndex === i ? "border-orange-500" : "border-transparent hover:border-gray-300"
                }`}
              >
                <img src={img} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
                {i === 4 && images.length > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                    +{images.length - 5}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute start-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute end-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[activeIndex]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 text-sm text-white/60">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
