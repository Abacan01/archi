"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { InlineEditor } from "./inline-editor";
import { EditProjectButton } from "./edit-project-button";
import { useEffect } from "react";
import { useEditSession } from "./edit-session-provider";
import type { ProjectItem } from "../lib/content-types";

interface ProjectsGridProps {
  projects: ProjectItem[];
  isEditMode: boolean;
}

export function ProjectsGrid({ projects, isEditMode }: ProjectsGridProps) {
  const session = useEditSession();
  const canEdit = Boolean(isEditMode || session?.isEditMode);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIndices.size === 0) return;
    if (!window.confirm(`Delete ${selectedIndices.size} project(s)?`)) return;

    setIsDeleting(true);
    try {
      if (!db) {
        console.error("Firebase not configured (db is null)");
        return;
      }

      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      let currentProjects = Array.isArray(data.projectItems) ? [...data.projectItems] : [];

      // Sort indices in descending order to avoid index shifting during deletion
      const sortedIndices = Array.from(selectedIndices).sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        if (idx >= 0 && idx < currentProjects.length) {
          currentProjects.splice(idx, 1);
        }
      }

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
        author: "Admin (Bulk Delete Projects)",
      });

      setSelectedIndices(new Set());
      router.refresh();
    } catch (error) {
      console.error("Failed to delete projects:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      if (selectedIndices.size === 0) {
        // nothing selected
        return;
      }
      void handleBulkDelete();
    };

    window.addEventListener("projects:bulk-delete", handler as EventListener);
    return () => window.removeEventListener("projects:bulk-delete", handler as EventListener);
  }, [selectedIndices]);

  useEffect(() => {
    const onToggle = (ev: Event) => {
      const e = ev as CustomEvent<{ index?: number }> ;
      const idx = typeof e.detail?.index === "number" ? e.detail.index : undefined;
      if (idx === undefined) return;
      toggleSelect(idx);
    };

    window.addEventListener("projects:toggle-selection", onToggle as EventListener);
    return () => window.removeEventListener("projects:toggle-selection", onToggle as EventListener);
  }, [selectedIndices]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("projects:selection-count", { detail: { count: selectedIndices.size } }));
  }, [selectedIndices]);

  return (
    <>
      <div className="project-grid">
        {projects.map((project, index) => (
          <div key={project.slug || project.title || project.id || String(index)} style={{ position: "relative" }}>
            {canEdit && (
              <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", display: "flex", gap: "0.5rem", zIndex: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedIndices.has(index)}
                  onChange={() => toggleSelect(index)}
                  style={{
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    accentColor: "#4CAF50",
                  }}
                  title="Select for bulk delete"
                />
              </div>
            )}
            <article className="project-card project-card-display" data-type={(project.category || "").toLowerCase()} data-stage={project.status === "Completed" || project.status === "Sold" ? "accomplished" : "rendered"}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                {project.coverImageUrl ? (
                  <InlineEditor type="image" path={`projectItems[${index}].coverImageUrl`} initialValue={project.coverImageUrl} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
                    No cover image
                  </div>
                )}
              </div>
              <div>
                <InlineEditor as="p" className="tag" path={`projectItems[${index}].category`} initialValue={project.category} />
                <InlineEditor as="p" className={`status-pill ${project.status === "Completed" || project.status === "Sold" ? "status-pill-accomplished" : "status-pill-rendered"}`} path={`projectItems[${index}].status`} initialValue={project.status || "Published"} />
                <InlineEditor as="h3" path={`projectItems[${index}].title`} initialValue={project.title} />
                <InlineEditor as="p" className="spotlight-description" path={`projectItems[${index}].descriptionText`} initialValue={project.descriptionText || ""} multiline />
                {isEditMode && (
                  <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-start", gap: "0.5rem" }}>
                    <EditProjectButton projectIndex={index} project={project} isEditMode={isEditMode} compact />
                  </div>
                )}
              </div>
            </article>
          </div>
        ))}
      </div>
    </>
  );
}
