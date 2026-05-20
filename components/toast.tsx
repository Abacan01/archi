"use client";

import React, { useEffect, useState } from "react";

type Toast = { id: string; message: string; type?: "success" | "error" | "info"; actionLabel?: string; actionEvent?: string };

export function showToast(message: string, type: "success" | "error" | "info" = "info", actionLabel?: string, actionEvent?: string) {
  if (typeof window === "undefined") return;
  const ev = new CustomEvent("archi:toast", { detail: { message, type, actionLabel, actionEvent } });
  window.dispatchEvent(ev as Event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { message: string; type?: Toast["type"]; actionLabel?: string; actionEvent?: string };
      const t: Toast = { id: crypto.randomUUID(), message: d.message, type: d.type || "info", actionLabel: d.actionLabel, actionEvent: d.actionEvent };
      setToasts((cur) => [...cur, t]);
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, 6000);
    };

    window.addEventListener("archi:toast", handler as EventListener);
    return () => window.removeEventListener("archi:toast", handler as EventListener);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ marginBottom: 8, padding: "0.6rem 1rem", borderRadius: 6, color: "#fff", background: t.type === "error" ? "#e53935" : t.type === "success" ? "#43a047" : "#333", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>{t.message}</div>
            {t.actionLabel && t.actionEvent ? (
              <button
                onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent(t.actionEvent || ""));
                  } catch (e) {
                    // ignore
                  }
                }}
                style={{ marginLeft: 12, padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 700 }}
              >
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
