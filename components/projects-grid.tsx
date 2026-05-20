"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { InlineEditor } from "./inline-editor";
import { useEffect, useMemo } from "react";
import { showToast } from "./toast";
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
  const [tagEditingIndex, setTagEditingIndex] = useState<number | null>(null);
  const [newTagInputs, setNewTagInputs] = useState<{ [key: number]: string }>({});
  const [isSavingTags, setIsSavingTags] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();

  const normalizeText = (value: string) => value.trim().toLowerCase();

  const isPendingProject = (projectIndex: number): boolean => {
    return projectIndex >= projects.length;
  };

  const getPendingProjectIndex = (projectIndex: number): number => {
    return projectIndex - projects.length;
  };

  const handleRemoveTag = async (projectIndex: number, tagToRemove: string) => {
    if (!canEdit) return;

    setIsSavingTags((prev) => ({ ...prev, [projectIndex]: true }));

    try {
      // Handle pending (newly added) projects
      if (isPendingProject(projectIndex)) {
        const pendingIdx = getPendingProjectIndex(projectIndex);
        const pendingOp = session?.pendingProjectOps?.[pendingIdx];
        
        if (pendingOp && (pendingOp.type === "add" || pendingOp.type === "edit")) {
          const updatedProject = {
            ...pendingOp.project,
            tags: (pendingOp.project.tags || []).filter((tag: string) => tag !== tagToRemove),
          };

          if (pendingOp.type === "add") {
            session?.addPendingProjectOperation({
              type: "add",
              project: updatedProject,
            });
          } else {
            session?.addPendingProjectOperation({
              type: "edit",
              index: pendingOp.index,
              project: updatedProject,
            });
          }
        }
        return;
      }

      // Add to pending operations for existing projects
      if (projectIndex >= 0 && projectIndex < projects.length) {
        // Check if there's already a pending edit for this project
        const existingEditOp = session?.pendingProjectOps?.find(
          (op) => op.type === "edit" && op.index === projectIndex
        );
        
        const baseProject = existingEditOp && existingEditOp.type === "edit" ? existingEditOp.project : projects[projectIndex];
        const project = { ...baseProject };
        const updatedTags = (project.tags || []).filter((tag: string) => tag !== tagToRemove);
        
        session?.addPendingProjectOperation({
          type: "edit",
          project: { ...project, tags: updatedTags },
          index: projectIndex,
        });
      }
    } catch (error) {
      console.error("Failed to remove tag:", error);
    } finally {
      setIsSavingTags((prev) => ({ ...prev, [projectIndex]: false }));
    }
  };

  const handleAddTag = async (projectIndex: number) => {
    const newTag = (newTagInputs[projectIndex] || "").trim();
    if (!newTag || !canEdit) return;

    setIsSavingTags((prev) => ({ ...prev, [projectIndex]: true }));

    try {
      // Handle pending (newly added) projects
      if (isPendingProject(projectIndex)) {
        const pendingIdx = getPendingProjectIndex(projectIndex);
        const pendingOp = session?.pendingProjectOps?.[pendingIdx];
        
        if (pendingOp && (pendingOp.type === "add" || pendingOp.type === "edit")) {
          const existingTags = Array.isArray(pendingOp.project.tags) ? [...pendingOp.project.tags] : [];
          
          if (!existingTags.includes(newTag)) {
            existingTags.push(newTag);
            const updatedProject = {
              ...pendingOp.project,
              tags: existingTags,
            };

            if (pendingOp.type === "add") {
              session?.addPendingProjectOperation({
                type: "add",
                project: updatedProject,
              });
            } else {
              session?.addPendingProjectOperation({
                type: "edit",
                index: pendingOp.index,
                project: updatedProject,
              });
            }
            
            setNewTagInputs((prev) => ({ ...prev, [projectIndex]: "" }));
          }
        }
        return;
      }
      
      // Add to pending operations for existing projects
      if (projectIndex >= 0 && projectIndex < projects.length) {
        // Check if there's already a pending edit for this project
        const existingEditOp = session?.pendingProjectOps?.find(
          (op) => op.type === "edit" && op.index === projectIndex
        );
        
        const baseProject = existingEditOp && existingEditOp.type === "edit" ? existingEditOp.project : projects[projectIndex];
        const project = { ...baseProject };
        const existingTags = Array.isArray(project.tags) ? [...project.tags] : [];
        
        if (!existingTags.includes(newTag)) {
          existingTags.push(newTag);
          
          session?.addPendingProjectOperation({
            type: "edit",
            project: { ...project, tags: existingTags },
            index: projectIndex,
          });
          
          setNewTagInputs((prev) => ({ ...prev, [projectIndex]: "" }));
        }
      }
    } catch (error) {
      console.error("Failed to add tag:", error);
    } finally {
      setIsSavingTags((prev) => ({ ...prev, [projectIndex]: false }));
    }
  };

  // Merge pending project operations with existing projects for real-time display
  const displayProjects = useMemo(() => {
    if (!session?.pendingProjectOps || session.pendingProjectOps.length === 0) {
      return projects;
    }

    let merged = [...projects];
    
    for (const op of session.pendingProjectOps) {
      if (op.type === "add") {
        merged.push(op.project);
      } else if (op.type === "edit") {
        if (op.index >= 0 && op.index < merged.length) {
          merged[op.index] = op.project;
        }
      } else if (op.type === "delete") {
        if (op.index >= 0 && op.index < merged.length) {
          merged.splice(op.index, 1);
        }
      }
    }
    
    return merged;
  }, [projects, session?.pendingProjectOps]);

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
      {displayProjects.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)", fontSize: "1rem" }}>
          NO EXISTING PROJECT CREATED
        </div>
      ) : (
        <div className="project-grid project-grid-panels">
          {displayProjects.map((project, index) => (
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
            {isPendingProject(index) && (
              <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 15 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Discard this draft?")) return;
                    const pendingIdx = getPendingProjectIndex(index);
                    if (typeof pendingIdx === "number") {
                      session?.discardPendingWithUndo(pendingIdx);
                      showToast("Draft discarded.", "info", "Undo", "archi:undo-discard");
                    }
                  }}
                  title="Discard draft"
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,120,120,0.3)",
                    background: "rgba(255,120,120,0.1)",
                    color: "#ffd",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  Discard
                </button>
              </div>
            )}
            <article
              className={`project-card project-card-display project-spotlight project-list-panel${index % 2 === 0 ? " is-image-right" : ""}`}
              data-type={(project.category || "").toLowerCase()}
              data-stage={project.status === "Completed" || project.status === "Sold" ? "accomplished" : "rendered"}
              style={{
                opacity: session?.pendingProjectOps?.some(op => op.type === "add" && op.project === project) ? 0.85 : 1,
                border: session?.pendingProjectOps?.some(op => (op.type === "add" || op.type === "edit") && op.project === project) ? "2px solid rgba(76, 175, 80, 0.4)" : undefined,
              }}
            >
              <div className="project-spotlight-media project-list-panel-media" style={{ position: "relative", height: "100%" }}>
                {project.coverImageUrl ? (
                  <InlineEditor type="image" path={`projectItems[${index}].coverImageUrl`} initialValue={project.coverImageUrl} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
                    No cover image
                  </div>
                )}
              </div>
              <div className="project-spotlight-copy project-list-panel-copy">
                <div className="spotlight-heading">
                  <InlineEditor as="h3" path={`projectItems[${index}].title`} initialValue={project.title} />
                  <InlineEditor as="p" className="spotlight-type" path={`projectItems[${index}].category`} initialValue={project.category || "Residential"} />
                </div>
                <InlineEditor as="p" className="spotlight-description" path={`projectItems[${index}].descriptionText`} initialValue={project.descriptionText || ""} multiline />
                <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div className="spotlight-points" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                    {project.tags && project.tags.length > 0 && (
                      <>
                        {project.tags
                          .filter((tag) => normalizeText(tag) && normalizeText(tag) !== normalizeText(project.category || ""))
                          .map((tag, tagIdx) => (
                            <span
                              key={`tag-${tagIdx}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "0.3rem 0.75rem",
                                borderRadius: "14px",
                                border: "1px solid rgba(255, 200, 60, 0.45)",
                                background: "rgba(255, 199, 58, 0.14)",
                                color: "#ffd76a",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                                whiteSpace: "nowrap",
                                position: "relative",
                              }}
                            >
                              {tag}
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(index, tag)}
                                  disabled={isSavingTags[index]}
                                  style={{
                                    position: "absolute",
                                    top: "-6px",
                                    right: "-6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "14px",
                                    height: "14px",
                                    padding: "0",
                                    border: "none",
                                    background: "rgba(255, 76, 76, 0.6)",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    cursor: isSavingTags[index] ? "not-allowed" : "pointer",
                                    fontSize: "0.7rem",
                                    fontWeight: "bold",
                                    opacity: isSavingTags[index] ? 0.6 : 1,
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSavingTags[index]) {
                                      e.currentTarget.style.background = "rgba(255, 76, 76, 0.8)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSavingTags[index]) {
                                      e.currentTarget.style.background = "rgba(255, 76, 76, 0.6)";
                                    }
                                  }}
                                  title="Remove tag"
                                  aria-label={`Remove tag ${tag}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                      </>
                    )}
                  </div>
                  {canEdit && tagEditingIndex === index && (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={newTagInputs[index] || ""}
                        onChange={(e) => setNewTagInputs((prev) => ({ ...prev, [index]: e.target.value }))}
                        placeholder="new tag"
                        disabled={isSavingTags[index]}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag(index);
                          }
                        }}
                        style={{
                          padding: "0.3rem 0.5rem",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 200, 60, 0.45)",
                          background: "rgba(255, 199, 58, 0.08)",
                          color: "#ffd76a",
                          fontSize: "0.8rem",
                          outline: "none",
                          opacity: isSavingTags[index] ? 0.6 : 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(index)}
                        disabled={!newTagInputs[index]?.trim() || isSavingTags[index]}
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 200, 60, 0.45)",
                          background: "rgba(255, 199, 58, 0.16)",
                          color: "#ffdf7f",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: !newTagInputs[index]?.trim() || isSavingTags[index] ? "not-allowed" : "pointer",
                          opacity: !newTagInputs[index]?.trim() || isSavingTags[index] ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (newTagInputs[index]?.trim() && !isSavingTags[index]) {
                            e.currentTarget.style.background = "rgba(255, 199, 58, 0.26)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (newTagInputs[index]?.trim() && !isSavingTags[index]) {
                            e.currentTarget.style.background = "rgba(255, 199, 58, 0.16)";
                          }
                        }}
                      >
                        {isSavingTags[index] ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTagEditingIndex(null);
                          setNewTagInputs((prev) => ({ ...prev, [index]: "" }));
                        }}
                        disabled={isSavingTags[index]}
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.22)",
                          background: "rgba(255,255,255,0.08)",
                          color: "inherit",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          opacity: isSavingTags[index] ? 0.6 : 1,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {canEdit && tagEditingIndex !== index && (
                  <button
                    type="button"
                    onClick={() => setTagEditingIndex(index)}
                    style={{
                      display: "inline-flex",
                      width: "fit-content",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.4rem 0.8rem",
                      marginTop: "0.25rem",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 200, 60, 0.45)",
                      background: "rgba(255, 199, 58, 0.14)",
                      color: "#ffdf7f",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 199, 58, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 199, 58, 0.14)";
                    }}
                  >
                    + Add new tags
                  </button>
                )}
              </div>
            </article>
          </div>
        ))}
        </div>
      )}
    </>
  );
}
