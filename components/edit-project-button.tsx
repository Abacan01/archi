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
  const [title, setTitle] = useState(project.title || "");
  const [category, setCategory] = useState(project.category || "Residential");
  const [status, setStatus] = useState(project.status || "Residential");
  const [year, setYear] = useState(String(project.year || new Date().getFullYear()));
  const [coverImageUrl, setCoverImageUrl] = useState(project.coverImageUrl || "");
  const [coverImageAlt, setCoverImageAlt] = useState(project.coverImageAlt || "");
  const [descriptionText, setDescriptionText] = useState(project.descriptionText || "");
  const [location, setLocation] = useState(project.location || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const session = useEditSession();
  const canEdit = Boolean(isEditMode || session?.isEditMode);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpdateProject = async () => {
    if (!db || isEditing || !canEdit) return;
    const safeTitle = title.trim();
    if (!safeTitle) return;

    setIsEditing(true);

    try {
      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      const currentProjects = Array.isArray(data.projectItems) ? [...data.projectItems] : [];
      if (projectIndex < 0 || projectIndex >= currentProjects.length) return;

      const updatedProject: ProjectItem = {
        ...currentProjects[projectIndex],
        title: safeTitle,
        category: category || "Residential",
        status: status || "Residential",
        year: Number(year) || new Date().getFullYear(),
        location: location.trim(),
        descriptionText: descriptionText.trim(),
        coverImageUrl: coverImageUrl.trim() || "",
        coverImageAlt: coverImageAlt.trim() || `${safeTitle} cover image`,
      };

      currentProjects[projectIndex] = updatedProject;

      await setDoc(contentRef, {
        ...data,
        projectItems: currentProjects,
      }, { merge: false });

      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: {
          ...data,
          projectItems: currentProjects,
        },
        author: "Admin (Edit Project)",
      });

      setIsFormOpen(false);
      router.refresh();
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
            <h3 style={{ marginBottom: "0.75rem" }}>Edit Project</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="Cover image URL (optional)" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit", flex: 1 }} />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                <button type="button" onClick={() => fileInputRef?.current?.click()} style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "inherit" }}>
                  {isUploading ? "Uploading..." : "Choose Image"}
                </button>
              </div>
              <input value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} placeholder="Cover image alt text" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              <textarea value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} placeholder="Description" rows={4} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.9rem" }}>
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
