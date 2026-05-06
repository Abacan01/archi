"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import type { ProjectItem } from "../lib/content-types";
import type { CSSProperties } from "react";
import { useEditSession } from "./edit-session-provider";
import { createPortal } from "react-dom";

interface AddProjectButtonProps {
  isEditMode: boolean;
  compact?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function AddProjectButton({ isEditMode, compact = false, label = "+ Add Project", className, style }: AddProjectButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Residential");
  const [status, setStatus] = useState("In Progress");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();
  const session = useEditSession();
  const canEdit = Boolean(isEditMode || session?.isEditMode);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleCreateProject = async () => {
    if (!db || isAdding || !canEdit) return;
    const safeTitle = title.trim();
    if (!safeTitle) return;

    setIsAdding(true);

    try {
      const normalizedSlug = slugify(safeTitle) || `project-${Date.now()}`;
      const newProject: ProjectItem = {
        title: safeTitle,
        category: category || "Residential",
        status: status || "In Progress",
        year: Number(year) || new Date().getFullYear(),
        slug: normalizedSlug,
        location: location.trim(),
        descriptionText: descriptionText.trim(),
        coverImageUrl: coverImageUrl.trim() || "",
        coverImageAlt: coverImageAlt.trim() || `${safeTitle} cover image`,
        gallery: [],
      };

      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      const nextProjects = [...(data.projectItems || []), newProject];

      await setDoc(contentRef, {
        ...data,
        projectItems: nextProjects,
      }, { merge: false });

      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: {
          ...data,
          projectItems: nextProjects,
        },
        author: "Admin (Add Project)",
      });

      setIsFormOpen(false);
      setTitle("");
      setCategory("Residential");
      setStatus("In Progress");
      setYear(String(new Date().getFullYear()));
      setCoverImageUrl("");
      setCoverImageAlt("");
      setDescriptionText("");
      setLocation("");
      router.refresh();
    } catch (error) {
      console.error("Failed to add project:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Prefer server-side flag, fall back to client-side edit session if needed
  if (!canEdit) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        disabled={isAdding}
        className={className}
        style={{
          marginTop: compact ? 0 : "2rem",
          padding: compact ? "0.75rem 1rem" : "1rem 2rem",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          border: "1px solid rgba(76, 175, 80, 0.3)",
          borderRadius: "8px",
          color: "#4CAF50",
          cursor: "pointer",
          fontSize: compact ? "0.875rem" : "1rem",
          fontWeight: "600",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          ...style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
        }}
      >
        {label}
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
            <h3 style={{ marginBottom: "0.75rem" }}>Add New Project</h3>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
                <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
              </div>
              <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="Cover image URL (optional)" style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "inherit" }} />
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
                onClick={() => void handleCreateProject()}
                disabled={isAdding || !title.trim()}
                style={{ padding: "0.55rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(76, 175, 80, 0.35)", background: "rgba(76, 175, 80, 0.15)", color: "#6fda83" }}
              >
                {isAdding ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
