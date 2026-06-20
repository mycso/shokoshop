"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  function prev() {
    setActive((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function next() {
    setActive((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative h-96 lg:h-[570px] rounded-2xl overflow-hidden bg-gray-100 group">
        <Image
          src={images[active]}
          alt={`${name} – image ${active + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          priority
          unoptimized
        />

        {/* Prev / Next arrows — only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === active ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — only if multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-20 rounded-xl overflow-hidden bg-gray-100 border-2 transition-colors ${
                i === active
                  ? "border-brand"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
