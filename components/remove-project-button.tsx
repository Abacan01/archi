"use client";

import { useState } from "react";
import { useEditSession } from "./edit-session-provider";

interface RemoveProjectButtonProps {
  index: number;
  title?: string;
  isEditMode?: boolean;
}

export function RemoveProjectButton({ index, title, isEditMode: isEditModeProp }: RemoveProjectButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const session = useEditSession();
  const canEdit = isEditModeProp !== undefined ? isEditModeProp : Boolean(session?.isEditMode);

  const handleRemove = async () => {
    if (isRemoving || !canEdit) return;
    if (!window.confirm(`Remove ${title || "this project"}?`)) return;

    setIsRemoving(true);
    try {
      // Queue the delete operation instead of saving immediately
      session?.addPendingProjectOperation({ type: "delete", index });
    } catch (error) {
      console.error("Failed to remove project:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!canEdit) return null;

  return (
    <button
      type="button"
      onClick={() => void handleRemove()}
      disabled={isRemoving}
      style={{
        padding: "0.45rem 0.7rem",
        borderRadius: "999px",
        border: "1px solid rgba(255, 110, 110, 0.4)",
        background: "rgba(255, 110, 110, 0.14)",
        color: "#ff9c9c",
        cursor: "pointer",
        fontSize: "0.8rem",
        fontWeight: 700,
      }}
    >
      {isRemoving ? "Removing..." : "Remove Project"}
    </button>
  );
}