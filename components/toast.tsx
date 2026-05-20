"use client";

import React, { useEffect, useState } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" | "info" };

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  if (typeof window === "undefined") return;
  const ev = new CustomEvent("archi:toast", { detail: { message, type } });
  window.dispatchEvent(ev as Event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { message: string; type?: Toast["type"] };
      const t: Toast = { id: crypto.randomUUID(), message: d.message, type: d.type || "info" };
      setToasts((cur) => [...cur, t]);
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, 3500);
    };

    window.addEventListener("archi:toast", handler as EventListener);
    return () => window.removeEventListener("archi:toast", handler as EventListener);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ marginBottom: 8, padding: "0.6rem 1rem", borderRadius: 6, color: "#fff", background: t.type === "error" ? "#e53935" : t.type === "success" ? "#43a047" : "#333", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 200 }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
