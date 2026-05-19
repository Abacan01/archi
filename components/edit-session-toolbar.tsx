"use client";

import { useState } from "react";
import { useEditSession } from "./edit-session-provider";
import { EditFooterButton } from "./edit-footer-button";

export function EditSessionToolbar() {
  const { isEditMode, pendingChangeCount, saveAllDrafts, cancelAllDrafts } = useEditSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [publishNote, setPublishNote] = useState<string | null>(null);

  if (!isEditMode) return null;

  const handleSaveAll = async () => {
    if (pendingChangeCount === 0 || isSaving) return;
    setIsSaving(true);
    setPublishNote(null);
    try {
      const result = await saveAllDrafts();
      if (result.savedCount > 0) {
        setPublishNote(
          result.historyVerified
            ? `Published successfully. History entry ${result.historyId} verified. Live site updates should appear right away.`
            : `Published successfully, but history verification is still pending.`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAll = () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      void cancelAllDrafts();
      setPublishNote(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        left: "1.25rem",
        bottom: "1.25rem",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.8rem 0.9rem",
        borderRadius: "999px",
        background: "rgba(26, 33, 18, 0.88)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
        backdropFilter: "blur(14px)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.85rem", fontWeight: 600 }}>
        {pendingChangeCount > 0 ? `${pendingChangeCount} pending edit${pendingChangeCount === 1 ? "" : "s"}` : "No pending edits"}
      </span>
      <button
        type="button"
        onClick={() => void handleCancelAll()}
        disabled={pendingChangeCount === 0 || isSaving || isCancelling}
        style={{
          padding: "0.55rem 0.9rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: pendingChangeCount === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
          color: "white",
          cursor: pendingChangeCount === 0 || isSaving || isCancelling ? "not-allowed" : "pointer",
          fontWeight: 700,
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void handleSaveAll()}
        disabled={pendingChangeCount === 0 || isSaving || isCancelling}
        style={{
          padding: "0.55rem 0.95rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: pendingChangeCount === 0 ? "rgba(255,255,255,0.08)" : "#4CAF50",
          color: "white",
          cursor: pendingChangeCount === 0 || isSaving || isCancelling ? "not-allowed" : "pointer",
          fontWeight: 800,
        }}
      >
        {isSaving ? "Publishing..." : "Publish Update"}
      </button>
      {publishNote ? (
        <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem", maxWidth: "22rem", lineHeight: 1.35 }}>
          {publishNote}
        </span>
      ) : null}
      <EditFooterButton isEditMode={isEditMode} className="edit-footer-toolbar-trigger" />
    </div>
  );
}