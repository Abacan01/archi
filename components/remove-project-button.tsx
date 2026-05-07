"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { useEditSession } from "./edit-session-provider";

interface RemoveProjectButtonProps {
  index: number;
  title?: string;
  isEditMode?: boolean;
}

export function RemoveProjectButton({ index, title, isEditMode: isEditModeProp }: RemoveProjectButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();
  const session = useEditSession();
  const canEdit = isEditModeProp !== undefined ? isEditModeProp : Boolean(session?.isEditMode);

  const handleRemove = async () => {
    if (!db || isRemoving || !canEdit) return;
    if (!window.confirm(`Remove ${title || "this project"}?`)) return;

    setIsRemoving(true);
    try {
      const contentRef = doc(db, "siteContent", "main");
      const contentSnap = await getDoc(contentRef);
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      const currentProjects = Array.isArray(data.projectItems) ? [...data.projectItems] : [];
      if (index < 0 || index >= currentProjects.length) return;

      currentProjects.splice(index, 1);

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
        author: "Admin (Remove Project)",
      });

      router.refresh();
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