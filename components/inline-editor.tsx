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

  const resolvedValue = getDraftValue(path, initialValue);

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
        const adminSnap = await getDoc(doc(db, "admins", current.uid));
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
        onClick={handleImageClick}
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
    if (multiline) {
      return (
        <textarea
          className={className}
          id={id}
          value={value}
          onChange={(e) => commitDraft(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              discardDraft();
            }
          }}
          autoFocus
          style={{
            width: "100%",
            minHeight: "100px",
            background: "rgba(255,255,255,0.1)",
            color: "inherit",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.3)",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      );
    }

    return (
      <input
        type="text"
        className={className}
        id={id}
        value={value}
        onChange={(e) => commitDraft(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setIsEditing(false);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            discardDraft();
          }
        }}
        autoFocus
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          color: "inherit",
          padding: "0.25rem",
          borderRadius: "4px",
          border: "1px solid rgba(255,255,255,0.3)",
          fontFamily: "inherit",
          fontSize: "inherit",
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