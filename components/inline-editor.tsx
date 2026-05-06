"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase/client";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [prevInitial, setPrevInitial] = useState(initialValue);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (initialValue !== prevInitial) {
    setPrevInitial(initialValue);
    setValue(initialValue || "");
  }

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

  const createHistorySnapshot = async () => {
    if (!db) return;
    const snap = await getDoc(doc(db, "siteContent", "main"));
    if (snap.exists()) {
      const { collection, serverTimestamp, setDoc } = await import("firebase/firestore");
      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: snap.data(),
        author: auth.currentUser?.email || auth.currentUser?.uid || "Admin (Inline Edit)",
      });
    }
  };

  const handleSave = async (newValue?: string) => {
    const finalValue = newValue !== undefined ? newValue : value;
    setIsEditing(false);
    if (!db || finalValue === initialValue) return;

    try {
      await updateDoc(doc(db, "siteContent", "main"), {
        [path]: finalValue
      });
      await createHistorySnapshot();
    } catch (e) {
      console.error("Failed to save inline edit:", e);
      setValue(initialValue || ""); // revert on failure
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !db) return;

    setIsUploading(true);
    try {
      const safeName = file.name.replace(/\s+/g, "-");
      const storageRef = ref(storage, `site-content/${Date.now()}-${safeName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setValue(url);
      await handleSave(url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAdmin) {
    if (type === "image") {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={value} alt="" className={className} id={id} />;
    }
    if (!value) return null;
    return <Tag className={className} id={id} style={{ whiteSpace: multiline ? "pre-line" : "normal" }}>{value}</Tag>;
  }

  if (type === "image") {
    return (
      <div 
        className={`inline-image-editor ${className || ""}`}
        onClick={handleImageClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          cursor: "pointer",
          position: "relative",
          display: "inline-block",
          outline: isHovered ? "2px dashed rgba(255,255,255,0.5)" : "none",
          outlineOffset: "4px",
          transition: "outline 0.2s ease",
          opacity: isUploading ? 0.5 : 1
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Editable" style={{ display: "block", width: "100%", height: "auto" }} />
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
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => handleSave()}
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
            fontSize: "inherit"
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
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleSave()}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
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
          fontSize: "inherit"
        }}
      />
    );
  }

  return (
    <Tag
      className={className}
      id={id}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
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
        whiteSpace: multiline ? "pre-line" : "normal"
      }}
    >
      {value || "Click to add text"}
    </Tag>
  );
}
