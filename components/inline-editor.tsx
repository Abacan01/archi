"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase/client";
import { useEditSession } from "./edit-session-provider";
import { setNestedValue } from "../lib/editor-path";

interface InlineEditorProps {
  path: string;
  initialValue: string | null | undefined;
  as?: React.ElementType;
  className?: string;
  id?: string;
  multiline?: boolean;
  type?: "text" | "image";
}

export function InlineEditor({
  path,
  initialValue,
  as: Tag = "span",
  className,
  id,
  multiline,
  type = "text",
}: InlineEditorProps) {
  const { getDraftValue, setDraftValue, clearDraftValue } = useEditSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(() => getDraftValue(path, initialValue));
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement | null>(null);

  const resolvedValue = getDraftValue(path, initialValue);

  const editorStyle = {
    width: "100%",
    display: "block",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    padding: multiline ? "0.45rem 0.5rem" : "0.2rem 0.35rem",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.28)",
    boxSizing: "border-box" as const,
  };

  useEffect(() => {
    if (!isEditing) {
      setValue(resolvedValue);
    }
  }, [isEditing, resolvedValue]);

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

  const persistImmediateValue = async (nextValue: string) => {
    if (!db) return;

    const contentRef = doc(db, "siteContent", "main");
    const snap = await getDoc(contentRef);
    if (!snap.exists()) return;

    const updatedData = setNestedValue(snap.data(), path, nextValue);
    await setDoc(contentRef, updatedData, { merge: false });

    const author = auth?.currentUser?.email || auth?.currentUser?.uid || "Admin (Inline Edit)";
    const historyRef = doc(collection(db, "siteHistory"));
    await setDoc(historyRef, {
      timestamp: serverTimestamp(),
      data: updatedData,
      author,
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof fileInputRef.current?.showPicker === "function") {
      fileInputRef.current.showPicker();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !auth?.currentUser) return;

    setIsUploading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.secureUrl) {
        throw new Error(payload?.error || "Upload failed.");
      }

      setValue(payload.secureUrl);
      await persistImmediateValue(payload.secureUrl);
      clearDraftValue(path);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsUploading(false);
    }
  };

  const beginEditing = () => {
    setValue(resolvedValue);
    setIsEditing(true);
  };

  useEffect(() => {
    if (!isEditing) return;
    const element = editorRef.current;
    if (!element) return;

    // Set initial text content when editing starts
    element.textContent = resolvedValue;

    // Focus and place cursor at the end
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.focus();
  }, [isEditing, resolvedValue]);

  const commitDraft = (nextValue: string) => {
    setValue(nextValue);
    if (nextValue === (initialValue ?? "")) {
      clearDraftValue(path);
      return;
    }
    setDraftValue(path, nextValue);
  };

  const discardDraft = () => {
    setValue(initialValue || "");
    clearDraftValue(path);
    setIsEditing(false);
  };

  if (!isAdmin) {
    if (type === "image") {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={resolvedValue} alt="" className={className} id={id} data-inline-editor="true" />;
    }
    if (!resolvedValue) return null;
    return <Tag className={className} id={id} data-inline-editor="true" style={{ whiteSpace: multiline ? "pre-line" : "normal" }}>{resolvedValue}</Tag>;
  }

  if (type === "image") {
    return (
      <div
        className={`inline-image-editor ${className || ""}`}
        data-inline-editor="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          cursor: "pointer",
          position: "relative",
          display: "block",
          width: "100%",
          height: "100%",
          outline: isHovered ? "2px dashed rgba(255,255,255,0.5)" : "none",
          outlineOffset: "4px",
          transition: "outline 0.2s ease",
          opacity: isUploading ? 0.5 : 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedValue} alt="Editable" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" as any }} />
        {isHovered && !isUploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}>
            <button
              type="button"
              onClick={handleImageClick}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              Replace image
            </button>
          </div>
        )}
        {isUploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
            <span style={{ color: "#fff", fontSize: "0.8rem" }}>Uploading...</span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Tag
        className={className}
        id={id}
        ref={editorRef as any}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          const textContent = (e.currentTarget.textContent || "").replace(/\u00A0/g, " ");
          commitDraft(textContent);
        }}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Escape") {
            e.preventDefault();
            discardDraft();
          }
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            setIsEditing(false);
          }
        }}
        style={{
          ...editorStyle,
          outline: "none",
          cursor: "text",
          whiteSpace: multiline ? "pre-wrap" : "inherit",
        }}
      />
    );
  }

  return (
    <Tag
      className={className}
      id={id}
      data-inline-editor="true"
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        beginEditing();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to edit"
      style={{
        cursor: "pointer",
        outline: isHovered ? "2px dashed rgba(255,255,255,0.5)" : "none",
        outlineOffset: "4px",
        borderRadius: "2px",
        transition: "outline 0.2s ease",
        whiteSpace: multiline ? "pre-line" : "normal",
      }}
    >
      {resolvedValue || "Click to add text"}
    </Tag>
  );
}