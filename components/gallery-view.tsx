"use client";

import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconPlus, IconTrash, IconUpload } from "../app/admin/icons";
import { useEditSession } from "./edit-session-provider";
import { auth, db } from "../lib/firebase/client";
import type { GalleryItem } from "../lib/content-types";

type GalleryViewProps = {
  items: GalleryItem[];
};

export function GalleryView({ items }: GalleryViewProps) {
  const session = useEditSession();
  const [galleryItems, setGalleryItems] = useState(items);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const canEdit = session.isEditMode && isAdmin;
  const activeItem = useMemo(() => galleryItems[activeIndex], [activeIndex, galleryItems]);

  useEffect(() => {
    setGalleryItems(items);
  }, [items]);

  useEffect(() => {
    setSelectedIndices((current) => current.filter((index) => index < galleryItems.length));
  }, [galleryItems.length]);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      if (!current || !db) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, "admins", current.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (galleryItems.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % galleryItems.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [galleryItems.length]);

  useEffect(() => {
    if (!galleryItems.length) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= galleryItems.length) {
      setActiveIndex(galleryItems.length - 1);
    }
  }, [activeIndex, galleryItems.length]);

  useEffect(() => {
    const activeThumb = thumbRefs.current[activeIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  const persistGalleryItems = async (nextItems: GalleryItem[]) => {
    if (!db) return;

    await updateDoc(doc(db, "siteContent", "main"), {
      "gallery.items": nextItems,
    });
  };

  const humanizeFileName = (fileName: string) => {
    const withoutExtension = fileName.replace(/\.[^.]+$/, "");
    const normalized = withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

    if (!normalized) return "Gallery Photo";

    return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const toggleSelectedIndex = (index: number) => {
    setSelectedIndices((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }

      return [...current, index].sort((a, b) => a - b);
    });
  };

  const handleAddPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth?.currentUser || !canEdit) return;

    setIsBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.secureUrl) {
        throw new Error(payload?.error || "Upload failed.");
      }

      const title = humanizeFileName(file.name);
      const nextItems = [
        ...galleryItems,
        {
          src: payload.secureUrl,
          alt: title,
          title,
          meta: "Uploaded photo",
        },
      ];

      setGalleryItems(nextItems);
      setActiveIndex(nextItems.length - 1);
      await persistGalleryItems(nextItems);
    } catch (error) {
      console.error("Failed to add gallery photo:", error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsBusy(false);
    }
  };

  const handleRemoveSelectedPhotos = async () => {
    if (!canEdit || isBusy || selectedIndices.length === 0) return;

    const count = selectedIndices.length;
    const message = count === 1 ? "Remove the selected gallery photo?" : `Remove these ${count} gallery photos?`;

    if (!window.confirm(message)) return;

    setIsBusy(true);
    try {
      const selectedSet = new Set(selectedIndices);
      const nextItems = galleryItems.filter((_, index) => !selectedSet.has(index));
      setGalleryItems(nextItems);
      setSelectedIndices([]);
      setActiveIndex((current) => {
        if (!nextItems.length) return 0;
        if (current >= nextItems.length) return nextItems.length - 1;
        return current;
      });
      await persistGalleryItems(nextItems);
    } catch (error) {
      console.error("Failed to remove selected gallery photos:", error);
    } finally {
      setIsBusy(false);
    }
  };

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + galleryItems.length) % galleryItems.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % galleryItems.length);
  }

  if (!galleryItems.length) {
    return (
      <div className="gallery-empty-state">
        <p className="section-note">Gallery content is not available yet.</p>
        {canEdit && (
          <div className="gallery-admin-panel gallery-admin-panel-empty">
            <div>
              <h3>Gallery Editor</h3>
              <p>Upload the first image to start building this gallery. Images are saved through Cloudinary automatically.</p>
            </div>
            <button
              type="button"
              className="gallery-admin-button gallery-admin-button-primary"
              onClick={handleAddPhotoClick}
              disabled={isBusy}
            >
              <IconPlus />
              {isBusy ? "Uploading..." : "Add First Photo"}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAddPhotoChange}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="gallery-view-intro">
        <div>
          <p className="gallery-view-kicker">Project Gallery</p>
          <h1>Browse finished spaces and selected studies</h1>
        </div>
        <p className="gallery-view-summary">
          Use the thumbnails to move between images, or the arrows to step through the collection in a clean full-view layout.
        </p>
      </div>

      {canEdit && (
        <div className="gallery-admin-panel">
          <div>
            <h3>Gallery Editor</h3>
            <p>Upload a new image, then use the checkboxes to remove one or more photos at once.</p>
          </div>
          <div className="gallery-admin-actions">
            <div className="gallery-admin-action-row">
              <button
                type="button"
                className="gallery-admin-button gallery-admin-button-primary"
                onClick={handleAddPhotoClick}
                disabled={isBusy}
              >
                <IconUpload />
                {isBusy ? "Uploading..." : "Add Photo"}
              </button>
              <button
                type="button"
                className="gallery-admin-button gallery-admin-button-danger"
                onClick={() => void handleRemoveSelectedPhotos()}
                disabled={isBusy || selectedIndices.length === 0}
              >
                <IconTrash />
                {selectedIndices.length > 0 ? `Remove Selected (${selectedIndices.length})` : "Remove Selected"}
              </button>
            </div>
            <span className="gallery-admin-hint">Images upload to Cloudinary and save automatically.</span>
          </div>
        </div>
      )}

      <div className="gallery-shell" role="region" aria-label="Project gallery view">
        <div className="gallery-thumbs" aria-label="Gallery thumbnails">
          {galleryItems.map((item, index) => {
            const isActive = index === activeIndex;
            const isSelected = selectedIndices.includes(index);
            return (
              <div key={`${item.src}-${index}`} className="gallery-thumb-shell">
                <button
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
                {canEdit && (
                  <label className={isSelected ? "gallery-thumb-checkbox checked" : "gallery-thumb-checkbox"} title={`Select ${item.title} for removal`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectedIndex(index)}
                      disabled={isBusy}
                    />
                  </label>
                )}
              </div>
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
          <div className="gallery-main-caption">
            <div>
              <p className="gallery-main-caption-kicker">Selected image</p>
              <h2>{activeItem.title}</h2>
              <p>{activeItem.meta || activeItem.alt}</p>
            </div>
            <span className="gallery-main-counter">
              {activeIndex + 1}/{galleryItems.length}
            </span>
          </div>
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
        {canEdit && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAddPhotoChange}
          />
        )}
      </div>
    </div>
  );
}
