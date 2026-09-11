"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ProductImageData {
  id: number;
  image_url: string;
  alt_text: string | null;
}

export default function ProductImageCarousel({
  images,
  productName,
}: {
  images: ProductImageData[];
  productName: string;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-gradient-to-br from-stone-50 to-sky-50/30 rounded-2xl border border-border overflow-hidden flex items-center justify-center">
        <span className="text-4xl font-bold text-muted/20">
          {productName.charAt(0)}
        </span>
      </div>
    );
  }

  const img = images[current];

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square bg-gradient-to-br from-stone-50 to-sky-50/30 rounded-2xl border border-border overflow-hidden cursor-zoom-in group"
          onClick={() => setLightbox(true)}
        >
          <Image
            src={img.image_url}
            alt={img.alt_text || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={90}
            className="object-contain p-8"
            priority
          />
          <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-surface/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4 text-foreground" />
          </div>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-border text-foreground hover:bg-surface transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-border text-foreground hover:bg-surface transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((thumb, i) => (
              <button
                key={thumb.id}
                type="button"
                onClick={() => setCurrent(i)}
                className={`relative w-16 h-16 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                  i === current
                    ? "border-accent ring-2 ring-accent/20"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <Image
                  src={thumb.image_url}
                  alt={thumb.alt_text || `${productName} ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative w-[90vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={img.image_url}
              alt={img.alt_text || productName}
              fill
              sizes="90vw"
              quality={95}
              className="object-contain"
              priority
            />
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-white/10 text-white text-sm">
              {current + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
