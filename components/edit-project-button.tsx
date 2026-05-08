"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase/client";
import type { ProjectItem } from "../lib/content-types";
import type { CSSProperties } from "react";
import { useEditSession } from "./edit-session-provider";
import { createPortal } from "react-dom";

interface EditProjectButtonProps {
  projectIndex: number;
  project: ProjectItem;
  isEditMode: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function EditProjectButton({ projectIndex, project, isEditMode, compact = false, className, style }: EditProjectButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["Residential", "Commercial"]);
  const [title, setTitle] = useState(project.title || "");
  const [category, setCategory] = useState(project.category || "Residential");
  const [status, setStatus] = useState(project.status || "Residential");
  const [year, setYear] = useState(String(project.year || new Date().getFullYear()));
  const [coverImageUrl, setCoverImageUrl] = useState(project.coverImageUrl || "");
  const [coverImageAlt, setCoverImageAlt] = useState(project.coverImageAlt || "");
  const [descriptionText, setDescriptionText] = useState(project.descriptionText || "");
  const [location, setLocation] = useState(project.location || "");
  const [tags, setTags] = useState<string[]>(project.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const session = useEditSession();
  const canEdit = Boolean(isEditMode || session?.isEditMode);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!db || !canEdit || !isFormOpen) return;

    const loadCategoryOptions = async () => {
      try {
        const firestore = db;
        if (!firestore) return;

        const contentRef = doc(firestore, "siteContent", "main");
        const contentSnap = await getDoc(contentRef);
        if (!contentSnap.exists()) return;

        const data = contentSnap.data() as Record<string, any>;
        const projectCategories = Array.isArray(data.projectItems)
          ? data.projectItems
              .map((item: Record<string, any>) => String(item?.category || "").trim())
              .filter(Boolean)
          : [];
        const filterLabels = Array.isArray(data.projectsPage?.filterLabels)
          ? data.projectsPage.filterLabels
              .map((label: unknown) => String(label || "").trim())
              .filter(Boolean)
          : [];

        const merged = Array.from(new Set(["Residential", "Commercial", ...projectCategories, ...filterLabels]));
        setCategoryOptions(merged);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    void loadCategoryOptions();
  }, [isFormOpen, canEdit]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        await uploadImage(file);
      }
    }
  };

  const uploadImage = async (file: File) => {
    if (!auth?.currentUser) {
      console.error("Must be signed in to upload images.");
      return;
    }

    setIsUploading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/cloudinary/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok || !payload?.secureUrl) {
        throw new Error(payload?.error || "Upload failed");
      }

      setCoverImageUrl(payload.secureUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (isEditing || !canEdit) return;
    const safeTitle = title.trim();
    if (!safeTitle) return;

    setIsEditing(true);

    try {
      const updatedProject: ProjectItem = {
        ...project,
        title: safeTitle,
        category: category || "Residential",
        status: status || "Residential",
        year: Number(year) || new Date().getFullYear(),
        location: location.trim(),
        descriptionText: descriptionText.trim(),
        coverImageUrl: coverImageUrl.trim() || "",
        coverImageAlt: coverImageAlt.trim() || `${safeTitle} cover image`,
        tags: tags.filter(Boolean),
      };

      // Queue the operation instead of saving immediately
      session?.addPendingProjectOperation({ type: "edit", index: projectIndex, project: updatedProject });

      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!auth?.currentUser) {
      console.error("Must be signed in to upload images.");
      return;
    }

    setIsUploading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/cloudinary/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok || !payload?.secureUrl) {
        throw new Error(payload?.error || "Upload failed");
      }

      setCoverImageUrl(payload.secureUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!db || !canEdit || isSavingCategory) return;
    const nextCategory = category.trim();
    if (!nextCategory) return;

    const existing = categoryOptions.find((option) => option.toLowerCase() === nextCategory.toLowerCase());
    if (existing) {
      setCategory(existing);
      return;
    }

    setIsSavingCategory(true);
    try {
      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      if (!contentSnap.exists()) return;

      const data = contentSnap.data() as Record<string, any>;
      const currentFilterLabels = Array.isArray(data.projectsPage?.filterLabels)
        ? data.projectsPage.filterLabels.map((label: unknown) => String(label || "").trim()).filter(Boolean)
        : [];

      const nextFilterLabels = Array.from(new Set([...currentFilterLabels, nextCategory]));

      await setDoc(contentRef, {
        ...data,
        projectsPage: {
          ...(data.projectsPage || {}),
          filterLabels: nextFilterLabels,
        },
      }, { merge: false });

      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: {
          ...data,
          projectsPage: {
            ...(data.projectsPage || {}),
            filterLabels: nextFilterLabels,
          },
        },
        author: "Admin (Add Category)",
      });

      setCategoryOptions((prev) => Array.from(new Set([...prev, nextCategory])));
      setCategory(nextCategory);
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  if (!canEdit) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        disabled={isEditing}
        className={className}
        style={{
          padding: compact ? "0.45rem 0.7rem" : "0.55rem 0.9rem",
          borderRadius: "8px",
          border: "1px solid rgba(100, 150, 255, 0.4)",
          backgroundColor: "rgba(100, 150, 255, 0.12)",
          color: "rgb(150, 180, 255)",
          cursor: "pointer",
          fontSize: compact ? "0.75rem" : "0.85rem",
          fontWeight: "600",
          transition: "all 0.2s",
          ...style,
        }}
      >
        Edit
      </button>

      {isMounted && isFormOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "min(640px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(22, 33, 21, 0.96)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
              padding: "1rem",
            }}
          >
            <h3 style={{ marginBottom: "1.25rem" }}>Edit Project</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Project Title */}
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Project Title</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="" 
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} 
                />
              </div>

              {/* Description */}
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Description</label>
                <textarea 
                  value={descriptionText} 
                  onChange={(e) => setDescriptionText(e.target.value)} 
                  placeholder="" 
                  rows={3} 
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit", resize: "vertical" }} 
                />
              </div>

              {/* Date Created & Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Date Created</label>
                  <input 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    placeholder="" 
                    style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} 
                  />
                </div>
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Type</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.22)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#cfeadf",
                    }}
                  >
                    <option value="Residential" style={{ color: "#0f3e2b", background: "#ffffff" }}>Residential</option>
                    <option value="Commercial" style={{ color: "#0f3e2b", background: "#ffffff" }}>Commercial</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>Tags</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.4rem" }}>
                  {tags.map((tag, idx) => (
                    <div 
                      key={`tag-${idx}`} 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "0.4rem", 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "6px", 
                        background: "rgba(76, 175, 80, 0.15)", 
                        border: "1px solid rgba(76, 175, 80, 0.35)", 
                        color: "#6fda83", 
                        fontSize: "0.9rem" 
                      }}
                    >
                      <span style={{ paddingLeft: 4, paddingRight: 4 }}>{tag || "Unnamed"}</span>
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        onClick={() => setTags((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ 
                          padding: "0.08rem 0.4rem", 
                          borderRadius: "4px", 
                          border: "none", 
                          background: "transparent", 
                          color: "#6fda83", 
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          lineHeight: "1",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = newTagInput.trim();
                        if (!val) return;
                        if (!tags.includes(val)) {
                          setTags((prev) => [...prev, val]);
                        }
                        setNewTagInput("");
                      }
                    }}
                    placeholder="add tags"
                    style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", color: "inherit", flex: 1 }}
                  />
                </div>
              </div>

              {/* Cover Image Alt Text */}
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>cover image alt text</label>
                <input 
                  value={coverImageAlt} 
                  onChange={(e) => setCoverImageAlt(e.target.value)} 
                  placeholder="" 
                  style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} 
                />
              </div>

              {/* Image Upload Area */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  position: "relative",
                  padding: "2.5rem 1rem",
                  borderRadius: "8px",
                  border: `2px ${isDragOver ? "solid" : "dashed"} ${isDragOver ? "rgba(76, 175, 80, 0.6)" : "rgba(255,255,255,0.15)"}`,
                  background: isDragOver ? "rgba(76, 175, 80, 0.08)" : "rgba(255,255,255,0.02)",
                  display: "grid",
                  placeItems: "center",
                  minHeight: "200px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                  overflow: "hidden",
                }}
              >
                {coverImageUrl ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <img 
                      src={coverImageUrl} 
                      alt="Uploaded cover" 
                      style={{ 
                        maxWidth: "100%", 
                        maxHeight: "100%", 
                        objectFit: "cover",
                        borderRadius: "4px"
                      }} 
                    />
                    <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef?.current?.click();
                        }}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(76, 175, 80, 0.35)",
                          background: "rgba(22, 33, 21, 0.9)",
                          color: "#6fda83",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverImageUrl("");
                        }}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(255, 76, 76, 0.35)",
                          background: "rgba(22, 33, 21, 0.9)",
                          color: "#ff6b6b",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "0.6rem", alignItems: "center" }}>
                    <div style={{ fontSize: "2rem" }}>📁</div>
                    <div>
                      <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.95rem", color: "rgba(255,255,255,0.7)" }}>
                        Drag and Drop
                      </p>
                      <p style={{ margin: "0", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                        or
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef?.current?.click()}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(76, 175, 80, 0.35)",
                        background: "rgba(76, 175, 80, 0.15)",
                        color: "#6fda83",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(76, 175, 80, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(76, 175, 80, 0.15)";
                      }}
                    >
                      {isUploading ? "Uploading..." : "Choose image"}
                    </button>
                  </div>
                )}
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadImage(file);
                    }
                  }} 
                  style={{ display: "none" }} 
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ padding: "0.55rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: "inherit" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateProject()}
                disabled={isEditing || !title.trim()}
                style={{ padding: "0.55rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(100, 150, 255, 0.35)", background: "rgba(100, 150, 255, 0.15)", color: "#96b4ff" }}
              >
                {isEditing ? "Updating..." : "Update Project"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
