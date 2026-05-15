"use client";

import { InlineEditor } from "./inline-editor";
import { ArrayItemRemoveButton } from "./array-editor-button";
import type { AboutContent } from "../lib/content-types";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";

interface AboutServicesProps {
  about: AboutContent;
  isEditMode: boolean;
}

export function AboutServices({ about, isEditMode }: AboutServicesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addButtonStyle = {
    marginTop: "0.75rem",
    padding: "0.5rem 1rem",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    border: "1px solid rgba(76, 175, 80, 0.3)",
    borderRadius: "4px",
    color: "#4CAF50",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  } as const;

  const handleAddService = async () => {
    if (!db || isAdding) return;
    setIsAdding(true);
    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;
      const data = contentSnap.data();
      const newServices = [...(data.about?.services || []), { title: "", paragraphs: [] }];
      await updateDoc(doc(db, "siteContent", "main"), {
        "about.services": newServices,
      });
    } catch (error) {
      console.error("Failed to add service:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section>
      <p className="db-eyebrow">Services</p>
      <div className="service-stack">
        {(about.services || []).map((service, serviceIdx) => (
          <article className="service-row" key={serviceIdx} style={{ position: "relative" }}>
            {isEditMode && (
              <div style={{ position: "absolute", top: 0, right: 0 }}>
                <ArrayItemRemoveButton
                  path="about.services"
                  index={serviceIdx}
                  renderAsMarker
                />
              </div>
            )}
            <InlineEditor as="h4" path={`about.services[${serviceIdx}].title`} initialValue={service.title} emptyText="" />
            {(service.paragraphs || []).map((paragraph, paraIdx) => (
              <div key={paraIdx} style={{ position: "relative", paddingRight: isEditMode ? "1.4rem" : 0, marginBottom: "0.5rem" }}>
                <InlineEditor
                  as="p"
                  path={`about.services[${serviceIdx}].paragraphs[${paraIdx}]`}
                  initialValue={paragraph}
                  multiline
                  emptyText=""
                />
                {isEditMode && (
                  <ArrayItemRemoveButton
                    path={`about.services[${serviceIdx}].paragraphs`}
                    index={paraIdx}
                    renderAsMarker
                    style={{ position: "absolute", top: "0.35rem", right: 0 }}
                  />
                )}
              </div>
            ))}
          </article>
        ))}
      </div>
      {isEditMode && (
        <button
          type="button"
          onClick={handleAddService}
          disabled={isAdding}
          style={addButtonStyle}
        >
          + Add Service
        </button>
      )}
    </section>
  );
}
