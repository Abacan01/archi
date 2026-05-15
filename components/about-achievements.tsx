"use client";

import { InlineEditor } from "./inline-editor";
import { ArrayItemRemoveButton } from "./array-editor-button";
import type { AboutContent } from "../lib/content-types";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";

interface AboutAchievementsProps {
  about: AboutContent;
  isEditMode: boolean;
}

export function AboutAchievements({ about, isEditMode }: AboutAchievementsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addButtonStyle = {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.5rem 1rem",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    border: "1px solid rgba(76, 175, 80, 0.3)",
    borderRadius: "4px",
    color: "#4CAF50",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
  } as const;

  const handleAddLicense = async () => {
    if (!db || isAdding) return;
    setIsAdding(true);
    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;
      const data = contentSnap.data();
      const newLicenses = [...(data.about?.licenseNumbers || []), ""];
      await updateDoc(doc(db, "siteContent", "main"), {
        "about.licenseNumbers": newLicenses,
      });
    } catch (error) {
      console.error("Failed to add license:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSpecialization = async () => {
    if (!db || isAdding) return;
    setIsAdding(true);
    try {
      const contentSnap = await getDoc(doc(db, "siteContent", "main"));
      if (!contentSnap.exists()) return;
      const data = contentSnap.data();
      const newSpecializations = [...(data.about?.specializations || []), ""];
      await updateDoc(doc(db, "siteContent", "main"), {
        "about.specializations": newSpecializations,
      });
    } catch (error) {
      console.error("Failed to add specialization:", error);
    } finally {
      setIsAdding(false);
    }
  };

    const handleAddMembership = async () => {
      if (!db || isAdding) return;
      setIsAdding(true);
      try {
        const contentSnap = await getDoc(doc(db, "siteContent", "main"));
        if (!contentSnap.exists()) return;
        const data = contentSnap.data();
        const newMemberships = [...(data.about?.memberships || []), { title: "", meta: "" }];
        await updateDoc(doc(db, "siteContent", "main"), {
          "about.memberships": newMemberships,
        });
      } catch (error) {
        console.error("Failed to add membership:", error);
      } finally {
        setIsAdding(false);
      }
    };

  return (
    <aside className="about-achievements">
      <section className="about-side-block">
        <p className="sidebar-eyebrow">Licenses</p>
        <div className="about-chip-list">
          {(about.licenseNumbers || []).map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <InlineEditor as="span" className="about-chip" path={`about.licenseNumbers[${idx}]`} initialValue={item} emptyText="" />
              {isEditMode && (
                <ArrayItemRemoveButton
                  path="about.licenseNumbers"
                  index={idx}
                  renderAsMarker
                />
              )}
            </div>
          ))}
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleAddLicense}
            disabled={isAdding}
            style={addButtonStyle}
          >
            + Add License
          </button>
        )}
      </section>

      <section className="about-side-block">
        <p className="sidebar-eyebrow">Specializations</p>
        <div className="about-chip-list">
          {(about.specializations || []).map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <InlineEditor as="span" className="about-chip" path={`about.specializations[${idx}]`} initialValue={item} emptyText="" />
              {isEditMode && (
                <ArrayItemRemoveButton
                  path="about.specializations"
                  index={idx}
                  renderAsMarker
                />
              )}
            </div>
          ))}
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleAddSpecialization}
            disabled={isAdding}
            style={addButtonStyle}
          >
            + Add Specialization
          </button>
        )}
      </section>

      <section className="about-side-block">
        <p className="sidebar-eyebrow">Memberships</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(about.memberships || []).map((membership, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <InlineEditor path={`about.memberships[${idx}].title`} initialValue={membership.title} emptyText="" />
              {isEditMode && (
                <ArrayItemRemoveButton
                  path="about.memberships"
                  index={idx}
                  renderAsMarker
                />
              )}
            </div>
          ))}
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleAddMembership}
            disabled={isAdding}
            style={addButtonStyle}
          >
            + Add Membership
          </button>
        )}
      </section>
    </aside>
  );
}
