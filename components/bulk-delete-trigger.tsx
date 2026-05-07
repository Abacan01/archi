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
      style={{ marginLeft: "0.5rem", padding: "0.45rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(255,100,100,0.5)", background: "rgba(255,100,100,0.14)", color: "rgb(255,150,150)", cursor: "pointer", fontWeight: 600 }}
    >
      {`Delete Selected (${selectedCount})`}
    </button>
  );
}
