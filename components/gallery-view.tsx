"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryItem } from "../lib/content-types";

type GalleryViewProps = {
  items: GalleryItem[];
};

export function GalleryView({ items }: GalleryViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeItem = useMemo(() => items[activeIndex], [activeIndex, items]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    const activeThumb = thumbRefs.current[activeIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  if (!items.length) {
    return <p className="section-note">Gallery content is not available yet.</p>;
  }

  return (
    <div className="gallery-shell" role="region" aria-label="Project gallery view">
      <div className="gallery-thumbs" aria-label="Gallery thumbnails">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.src}
              className={isActive ? "gallery-thumb active" : "gallery-thumb"}
              aria-label={`Show ${item.title}`}
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              type="button"
              ref={(element) => {
                thumbRefs.current[index] = element;
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="96px"
                className="gallery-thumb-image"
              />
            </button>
          );
        })}
      </div>

      <div className="gallery-main-panel">
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous image"
          className="gallery-btn-prev"
        >
          &lt;
        </button>
        <div className="gallery-main-media">
          <Image
            src={activeItem.src}
            alt={activeItem.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 78vw"
            className="gallery-main-image"
          />
        </div>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next image"
          className="gallery-btn-next"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
