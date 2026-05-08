"use client";

import React, { useEffect, useState } from "react";
import { useEditSession } from "./edit-session-provider";

interface Props {
  isEditMode: boolean;
}

export default function BulkDeleteTrigger({ isEditMode }: Props) {
  const session = useEditSession();
  const canEdit = Boolean(isEditMode || session?.isEditMode);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const onSelectionCount = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const count = Number(customEvent.detail?.count || 0);
      setSelectedCount(Number.isFinite(count) ? count : 0);
    };

    window.addEventListener("projects:selection-count", onSelectionCount as EventListener);
    return () => window.removeEventListener("projects:selection-count", onSelectionCount as EventListener);
  }, []);

  if (!canEdit) return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("projects:bulk-delete"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={selectedCount === 0}
      style={{
        marginLeft: "0.5rem",
        padding: "0.55rem 1.2rem",
        borderRadius: "8px",
        border: "1.5px solid rgba(255, 82, 82, 0.6)",
        background: selectedCount === 0 ? "rgba(255,100,100,0.08)" : "rgba(255, 82, 82, 0.18)",
        color: selectedCount === 0 ? "rgba(255,150,150,0.5)" : "#ff5252",
        cursor: selectedCount === 0 ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: "0.3px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: selectedCount === 0 ? "none" : "0 4px 12px rgba(255, 82, 82, 0.15)",
        opacity: selectedCount === 0 ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (selectedCount > 0) {
          e.currentTarget.style.background = "rgba(255, 82, 82, 0.23)";
        }
      }}
      onMouseLeave={(e) => {
        if (selectedCount > 0) {
          e.currentTarget.style.background = "rgba(255, 82, 82, 0.18)";
        }
      }}
    >
      {`Delete Selected (${selectedCount})`}
    </button>
  );
}
