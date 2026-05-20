"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase/client";
import { IconPlus, IconTrash } from "../app/admin/icons";

interface ArrayEditorButtonProps {
  path: string;
  label: string;
  newItemTemplate?: Record<string, any>;
}

export function ArrayEditorButton({ path, label, newItemTemplate = {} }: ArrayEditorButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      if (!current || !db) {
        setIsAdmin(false);
        return;
      }
      try {
        const firestore = db;
        if (!firestore) {
          setIsAdmin(false);
          return;
        }

        const adminSnap = await getDoc(doc(firestore, "admins", current.uid));
        setIsAdmin(adminSnap.exists());
      } catch (e) {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleAddItem = async () => {
    if (!isAdmin || !db || isBusy) return;
    setIsBusy(true);

    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      const pathParts = path.split(".");
      let current = data;

      // Navigate to the parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }

      const lastKey = pathParts[pathParts.length - 1];
      if (!Array.isArray(current[lastKey])) current[lastKey] = [];

      current[lastKey].push(newItemTemplate);

      // Build the update path
      let updatePath = "";
      for (let i = 0; i < pathParts.length; i++) {
        updatePath += (i > 0 ? "." : "") + pathParts[i];
      }

      await updateDoc(doc(db, "siteContent", "main"), {
        [path]: current[lastKey],
      });
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={handleAddItem}
      disabled={isBusy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        marginTop: "0.5rem",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        border: "1px solid rgba(76, 175, 80, 0.3)",
        borderRadius: "4px",
        color: "#4CAF50",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: "500",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
      }}
    >
      <IconPlus />
      {label}
    </button>
  );
}

interface ArrayItemRemoveButtonProps {
  path: string;
  index: number;
  renderAsX?: boolean;
  renderAsMarker?: boolean;
  style?: CSSProperties;
}

export function ArrayItemRemoveButton({ path, index, renderAsX = false, renderAsMarker = false, style }: ArrayItemRemoveButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      if (!current || !db) {
        setIsAdmin(false);
        return;
      }
      try {
        const firestore = db;
        if (!firestore) {
          setIsAdmin(false);
          return;
        }

        const adminSnap = await getDoc(doc(firestore, "admins", current.uid));
        setIsAdmin(adminSnap.exists());
      } catch (e) {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  // Don't render compact marker variant (inline small boxes) — hide by returning null.
  if (renderAsMarker) return null;

  const handleRemoveItem = async () => {
    if (!isAdmin || !db || isBusy) return;
    if (!confirm("Remove this item?")) return;

    setIsBusy(true);
    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      const pathParts = path.split(".");
      let current = data;

      for (let i = 0; i < pathParts.length; i++) {
        current = current[pathParts[i]];
      }

      if (Array.isArray(current)) {
        current.splice(index, 1);
        await updateDoc(doc(db, "siteContent", "main"), {
          [path]: current,
        });
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={handleRemoveItem}
      disabled={isBusy}
      title="Remove this item"
      style={{
        width: renderAsMarker ? "18px" : (renderAsX ? "18px" : undefined),
        height: renderAsMarker ? "12px" : (renderAsX ? "18px" : undefined),
        padding: renderAsMarker ? 0 : (renderAsX ? 0 : "0.35rem 0.6rem"),
        backgroundColor: "rgba(255, 68, 68, 0.1)",
        border: "1px solid rgba(255, 68, 68, 0.3)",
        borderRadius: renderAsMarker ? "4px" : (renderAsX ? "999px" : "4px"),
        color: "#FF4444",
        cursor: "pointer",
        fontSize: renderAsMarker ? "0" : (renderAsX ? "0.75rem" : "0.875rem"),
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        justifyContent: "center",
        lineHeight: 1,
        transition: "all 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.1)";
      }}
    >
      {renderAsMarker ? null : (renderAsX ? "x" : <IconTrash />)}
    </button>
  );
}
