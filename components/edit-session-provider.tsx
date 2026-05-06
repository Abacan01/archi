"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { auth, db } from "../lib/firebase/client";
import { setNestedValue } from "../lib/editor-path";

type EditSessionContextValue = {
  isEditMode: boolean;
  pendingChangeCount: number;
  getDraftValue: (path: string, fallback?: string | null) => string;
  setDraftValue: (path: string, value: string) => void;
  clearDraftValue: (path: string) => void;
  cancelAllDrafts: () => void;
  saveAllDrafts: () => Promise<number>;
};

const EditSessionContext = createContext<EditSessionContextValue | null>(null);

export function EditSessionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const currentEditMode = searchParams.get("editMode") === "true";
  const [isEditMode, setIsEditMode] = useState(currentEditMode);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsEditMode(currentEditMode);
  }, [currentEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setDrafts({});
    }
  }, [isEditMode]);

  const getDraftValue = useCallback((path: string, fallback?: string | null) => {
    return Object.prototype.hasOwnProperty.call(drafts, path) ? drafts[path] : fallback ?? "";
  }, [drafts]);

  const setDraftValue = useCallback((path: string, value: string) => {
    setDrafts((current) => ({ ...current, [path]: value }));
  }, []);

  const clearDraftValue = useCallback((path: string) => {
    setDrafts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, path)) {
        return current;
      }
      const next = { ...current };
      delete next[path];
      return next;
    });
  }, []);

  const cancelAllDrafts = useCallback(() => {
    setDrafts({});
  }, []);

  const saveAllDrafts = useCallback(async () => {
    if (!db || Object.keys(drafts).length === 0) {
      return 0;
    }

    const contentRef = doc(db, "siteContent", "main");
    const snap = await getDoc(contentRef);
    if (!snap.exists()) {
      throw new Error("Content document not found.");
    }

    let updatedData = snap.data();
    for (const [path, value] of Object.entries(drafts)) {
      updatedData = setNestedValue(updatedData, path, value);
    }

    await setDoc(contentRef, updatedData, { merge: false });

    setDrafts({});

    if (auth?.currentUser) {
      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: updatedData,
        author: auth.currentUser.email || auth.currentUser.uid || "Admin (Batch Edit)",
      });
    }

    return Object.keys(drafts).length;
  }, [drafts]);

  const value = useMemo<EditSessionContextValue>(() => ({
    isEditMode,
    pendingChangeCount: Object.keys(drafts).length,
    getDraftValue,
    setDraftValue,
    clearDraftValue,
    cancelAllDrafts,
    saveAllDrafts,
  }), [cancelAllDrafts, clearDraftValue, drafts, getDraftValue, isEditMode, saveAllDrafts, setDraftValue]);

  return <EditSessionContext.Provider value={value}>{children}</EditSessionContext.Provider>;
}

export function useEditSession() {
  const context = useContext(EditSessionContext);
  if (context) return context;

  return {
    isEditMode: false,
    pendingChangeCount: 0,
    getDraftValue: (_path: string, fallback?: string | null) => fallback ?? "",
    setDraftValue: () => {},
    clearDraftValue: () => {},
    cancelAllDrafts: () => {},
    saveAllDrafts: async () => 0,
  } satisfies EditSessionContextValue;
}