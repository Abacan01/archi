"use client";

import { InlineEditor } from "./inline-editor";
import { ArrayItemRemoveButton } from "./array-editor-button";
import type { AboutContent } from "../lib/content-types";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";

interface AboutPrinciplesProps {
  about: AboutContent;
  isEditMode: boolean;
}

export function AboutPrinciples({ about, isEditMode }: AboutPrinciplesProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPrinciple = async () => {
    if (!db || isAdding) return;
    setIsAdding(true);
    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;
      const data = contentSnap.data();
      const newPrinciples = [...(data.about?.principles || []), ""];
      await updateDoc(doc(db, "siteContent", "main"), {
        "about.principles": newPrinciples,
      });
    } catch (error) {
      console.error("Failed to add principle:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section>
      <p className="db-eyebrow">Architecture Design</p>
      <div className="service-stack">
        {(about.principles || []).map((paragraph, idx) => (
          <article className="service-row" key={idx} style={{ position: "relative" }}>
            {isEditMode && (
              <div style={{ position: "absolute", top: 0, right: 0 }}>
                <ArrayItemRemoveButton path="about.principles" index={idx} />
              </div>
            )}
            <InlineEditor as="blockquote" className="design-philosophy-quote" path={`about.principles[${idx}]`} initialValue={paragraph} multiline />
          </article>
        ))}
      </div>
      {isEditMode && (
        <button
          type="button"
          onClick={handleAddPrinciple}
          disabled={isAdding}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.3)",
            borderRadius: "4px",
            color: "#4CAF50",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          + Add Design Principle
        </button>
      )}
    </section>
  );
}
