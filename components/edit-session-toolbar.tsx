"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEditSession } from "./edit-session-provider";
import { EditFooterButton } from "./edit-footer-button";

export function EditSessionToolbar() {
  const router = useRouter();
  const { isEditMode, pendingChangeCount, saveAllDrafts, cancelAllDrafts } = useEditSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isEditMode) return null;

  const handleSaveAll = async () => {
    if (pendingChangeCount === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await saveAllDrafts();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAll = () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      void cancelAllDrafts();
      router.refresh();
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
        {isSaving ? "Saving..." : "Save All"}
      </button>
      <EditFooterButton isEditMode={isEditMode} className="edit-footer-toolbar-trigger" />
    </div>
  );
}