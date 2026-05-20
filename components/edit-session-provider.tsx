"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import ToastContainer from "./toast";
import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { auth, db } from "../lib/firebase/client";
import { setNestedValue } from "../lib/editor-path";
import type { ProjectItem } from "../lib/content-types";

type PendingProjectOperation = 
  | { type: "add"; project: ProjectItem }
  | { type: "edit"; index: number; project: ProjectItem }
  | { type: "delete"; index: number };

type EditSessionContextValue = {
  isEditMode: boolean;
  isAdmin: boolean;
  pendingChangeCount: number;
  pendingProjectOps: PendingProjectOperation[];
  getDraftValue: (path: string, fallback?: string | null) => string;
  setDraftValue: (path: string, value: string, baseValue?: string) => void;
  clearDraftValue: (path: string) => void;
  addPendingProjectOperation: (operation: PendingProjectOperation) => void;
  removePendingProjectOperation: (pendingIndex: number) => void;
  discardPendingWithUndo: (pendingIndex: number) => void;
  restoreLastRemovedPending: () => void;
  cancelAllDrafts: () => Promise<void>;
  saveAllDrafts: () => Promise<{
    savedCount: number;
    historyId: string | null;
    historyVerified: boolean;
  }>;
};

const EditSessionContext = createContext<EditSessionContextValue | null>(null);

export function EditSessionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const currentEditMode = searchParams.get("editMode") === "true";
  const [isEditMode, setIsEditMode] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftBases, setDraftBases] = useState<Record<string, string>>({});
  const [pendingProjectOps, setPendingProjectOps] = useState<PendingProjectOperation[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // edit mode is only enabled when the query param is present AND the current user is an admin
    setIsEditMode(Boolean(currentEditMode && isAdminUser));
  }, [currentEditMode, isAdminUser]);

  useEffect(() => {
    if (!auth || !db) {
      setIsAdminUser(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (current) => {
      if (!current || !db) {
        setIsAdminUser(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, "admins", current.uid));
        setIsAdminUser(adminSnap.exists());
      } catch (e) {
        setIsAdminUser(false);
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setDrafts({});
      setPendingProjectOps([]);
    }
  }, [isEditMode]);

  const getDraftValue = useCallback((path: string, fallback?: string | null) => {
    return Object.prototype.hasOwnProperty.call(drafts, path) ? drafts[path] : fallback ?? "";
  }, [drafts]);

  const recordDraftBase = useCallback((path: string, baseValue?: string) => {
    if (baseValue === undefined) {
      return;
    }

    setDraftBases((current) => {
      if (Object.prototype.hasOwnProperty.call(current, path)) {
        return current;
      }
      return { ...current, [path]: baseValue };
    });
  }, []);

  const setDraftValue = useCallback((path: string, value: string, baseValue?: string) => {
    setDrafts((current) => ({ ...current, [path]: value }));
    recordDraftBase(path, baseValue);
  }, [recordDraftBase]);

  const clearDraftValue = useCallback((path: string) => {
    setDrafts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, path)) {
        return current;
      }
      const next = { ...current };
      delete next[path];
      return next;
    });
    setDraftBases((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, path)) {
        return current;
      }
      const next = { ...current };
      delete next[path];
      return next;
    });
  }, []);

  const addPendingProjectOperation = useCallback((operation: PendingProjectOperation) => {
    setPendingProjectOps((current) => [...current, operation]);
  }, []);

  const removePendingProjectOperation = useCallback((pendingIndex: number) => {
    setPendingProjectOps((current) => {
      if (pendingIndex < 0 || pendingIndex >= current.length) return current;
      const next = [...current];
      next.splice(pendingIndex, 1);
      return next;
    });
  }, []);

  // Support undoable discard of pending operations
  const lastRemovedRef = useRef<{ op: PendingProjectOperation; index: number; timeoutId?: number } | null>(null);

  const restoreLastRemovedPending = useCallback(() => {
    const entry = lastRemovedRef.current;
    if (!entry) return;
    setPendingProjectOps((current) => {
      const next = [...current];
      const insertAt = Math.min(Math.max(0, entry.index), next.length);
      next.splice(insertAt, 0, entry.op);
      return next;
    });
    if (entry.timeoutId) {
      window.clearTimeout(entry.timeoutId);
    }
    lastRemovedRef.current = null;
  }, []);

  const discardPendingWithUndo = useCallback((pendingIndex: number) => {
    setPendingProjectOps((current) => {
      if (pendingIndex < 0 || pendingIndex >= current.length) return current;
      const next = [...current];
      const [removed] = next.splice(pendingIndex, 1);
      // store for undo
      if (removed) {
        if (lastRemovedRef.current && lastRemovedRef.current.timeoutId) {
          window.clearTimeout(lastRemovedRef.current.timeoutId);
        }
        const timeoutId = window.setTimeout(() => {
          lastRemovedRef.current = null;
        }, 6000) as unknown as number;
        lastRemovedRef.current = { op: removed, index: pendingIndex, timeoutId };
      }
      return next;
    });
  }, []);

  // Listen for a global undo event (fired by toast action)
  useEffect(() => {
    const handler = () => {
      restoreLastRemovedPending();
    };
    window.addEventListener("archi:undo-discard", handler as EventListener);
    return () => window.removeEventListener("archi:undo-discard", handler as EventListener);
  }, [restoreLastRemovedPending]);

  const cancelAllDrafts = useCallback(async () => {
    setDrafts({});
    setDraftBases({});
    setPendingProjectOps([]);
  }, []);

  const saveAllDrafts = useCallback(async () => {
    if (!db || (Object.keys(drafts).length === 0 && pendingProjectOps.length === 0)) {
      return { savedCount: 0, historyId: null, historyVerified: false };
    }

    const firestore = db;
    if (!firestore) {
      return { savedCount: 0, historyId: null, historyVerified: false };
    }

    const contentRef = doc(firestore, "siteContent", "main");
    const historyRef = doc(collection(firestore, "siteHistory"));
    const author = auth?.currentUser?.email || auth?.currentUser?.uid || "Admin (Batch Edit)";

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(contentRef);
      if (!snap.exists()) {
        throw new Error("Content document not found.");
      }

      let updatedData = snap.data();

      for (const [path, value] of Object.entries(drafts)) {
        updatedData = setNestedValue(updatedData, path, value);
      }

      if (pendingProjectOps.length > 0) {
        const currentProjects = Array.isArray(updatedData.projectItems) ? [...updatedData.projectItems] : [];

        for (const op of pendingProjectOps) {
          if (op.type === "add") {
            currentProjects.push(op.project);
          } else if (op.type === "edit") {
            if (op.index >= 0 && op.index < currentProjects.length) {
              currentProjects[op.index] = op.project;
            }
          } else if (op.type === "delete") {
            if (op.index >= 0 && op.index < currentProjects.length) {
              currentProjects.splice(op.index, 1);
            }
          }
        }

        updatedData.projectItems = currentProjects;
      }

      updatedData.updatedAt = serverTimestamp();
      updatedData.updatedBy = author;

      transaction.set(contentRef, updatedData, { merge: false });
      transaction.set(historyRef, {
        timestamp: serverTimestamp(),
        data: updatedData,
        author,
      });
    });

    const historySnap = await getDoc(historyRef);

    setDrafts({});
    setDraftBases({});
    setPendingProjectOps([]);

    return {
      savedCount: Object.keys(drafts).length + pendingProjectOps.length,
      historyId: historyRef.id,
      historyVerified: historySnap.exists(),
    };
  }, [drafts, pendingProjectOps]);

  const value = useMemo<EditSessionContextValue>(() => ({
    isEditMode,
    isAdmin: isAdminUser,
    pendingChangeCount: Object.keys(drafts).length + pendingProjectOps.length,
    pendingProjectOps,
    getDraftValue,
    setDraftValue,
    clearDraftValue,
    addPendingProjectOperation,
    removePendingProjectOperation,
    discardPendingWithUndo,
    restoreLastRemovedPending,
    cancelAllDrafts,
    saveAllDrafts,
  }), [cancelAllDrafts, clearDraftValue, drafts, getDraftValue, isEditMode, saveAllDrafts, setDraftValue, addPendingProjectOperation, pendingProjectOps, discardPendingWithUndo, restoreLastRemovedPending]);

  return (
    <>
      <EditSessionContext.Provider value={value}>{children}</EditSessionContext.Provider>
      <ToastContainer />
    </>
  );
}

export function useEditSession() {
  const context = useContext(EditSessionContext);
  if (context) return context;

  return {
    isEditMode: false,
    isAdmin: false,
    pendingChangeCount: 0,
    pendingProjectOps: [],
    getDraftValue: (_path: string, fallback?: string | null) => fallback ?? "",
    setDraftValue: () => {},
    clearDraftValue: () => {},
    addPendingProjectOperation: () => {},
    removePendingProjectOperation: () => {},
    discardPendingWithUndo: () => {},
    restoreLastRemovedPending: () => {},
    cancelAllDrafts: async () => {},
    saveAllDrafts: async () => ({ savedCount: 0, historyId: null, historyVerified: false }),
  } satisfies EditSessionContextValue;
}