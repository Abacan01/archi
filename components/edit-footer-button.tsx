"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { FooterContent, SocialLink, Badge } from "../lib/content-types";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { IconEdit, IconTrash, IconPlus } from "../app/admin/icons";

interface EditFooterButtonProps {
  footer?: FooterContent;
  isEditMode: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

const defaultFooter: FooterContent = {
  text: "(c) 2026 JCCHUA & Associates. All rights reserved.",
  socialLinks: [
    { label: "Facebook", href: "https://www.facebook.com/realter.joseph/", icon: "facebook" },
    { label: "LinkedIn", href: "https://linkedin.com/in/digiscribe", icon: "linkedin" },
  ],
  badges: [],
};

export function EditFooterButton({ footer, isEditMode, compact = false, className, style }: EditFooterButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [resolvedFooter, setResolvedFooter] = useState<FooterContent>(footer ?? defaultFooter);

  // Form state
  const [text, setText] = useState((footer ?? defaultFooter).text || "");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>((footer ?? defaultFooter).socialLinks || []);
  const [badges, setBadges] = useState<Badge[]>((footer ?? defaultFooter).badges || []);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthUser(null);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthUser(currentUser);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (footer) {
      setResolvedFooter(footer);
      return;
    }

    let isActive = true;
    const loadFooter = async () => {
      if (!db) {
        return;
      }

      try {
        const contentRef = doc(db, "siteContent", "main");
        const snap = await getDoc(contentRef);
        if (!isActive || !snap.exists()) {
          return;
        }

        const data = snap.data();
        setResolvedFooter(data?.global?.footer ?? defaultFooter);
      } catch {
        if (isActive) {
          setResolvedFooter(defaultFooter);
        }
      }
    };

    void loadFooter();

    return () => {
      isActive = false;
    };
  }, [footer]);

  useEffect(() => {
    setText(resolvedFooter.text || "");
    setSocialLinks(resolvedFooter.socialLinks || []);
    setBadges(resolvedFooter.badges || []);
  }, [resolvedFooter]);

  // Always render in edit mode for debugging - hide based on auth internally
  if (!isEditMode) return null;

  const handleAddSocialLink = () => {
    setSocialLinks([...socialLinks, { label: "", href: "", icon: "facebook" }]);
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleUpdateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const handleAddBadge = () => {
    setBadges([...badges, { label: "", href: "", imageUrl: "", imageAlt: "" }]);
  };

  const handleRemoveBadge = (index: number) => {
    setBadges(badges.filter((_, i) => i !== index));
  };

  const handleUpdateBadge = (index: number, field: keyof Badge, value: any) => {
    const updated = [...badges];
    updated[index] = { ...updated[index], [field]: value };
    setBadges(updated);
  };

  const handleSave = async () => {
    if (!db || isSaving) return;
    setIsSaving(true);

    try {
      const firestore = db;
      if (!firestore) {
        return;
      }

      const contentRef = doc(firestore, "siteContent", "main");
      const author = authUser?.email || authUser?.uid || "Admin (Footer Edit)";

      await runTransaction(firestore, async (transaction) => {
        const snap = await transaction.get(contentRef);

        if (!snap.exists()) {
          throw new Error("Content document not found.");
        }

        const currentData = snap.data();
        const updatedData = {
          ...currentData,
          global: {
            ...currentData.global,
            footer: {
              text,
              socialLinks,
              badges,
            },
          },
          updatedAt: serverTimestamp(),
          updatedBy: author,
        };

        const historyRef = doc(collection(firestore, "siteHistory"));
        transaction.set(contentRef, updatedData, { merge: false });
        transaction.set(historyRef, {
          timestamp: serverTimestamp(),
          data: updatedData,
          author,
        });
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save footer:", error);
      alert("Failed to save footer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setText(resolvedFooter.text || "");
    setSocialLinks(resolvedFooter.socialLinks || []);
    setBadges(resolvedFooter.badges || []);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (isAuthReady && !authUser) {
      alert("Please log in as an admin to edit the footer.");
      return;
    }
    setIsEditing(true);
  };

  return (
    <>
      <button
        onClick={handleEditClick}
        className={`btn-icon edit-footer-btn ${className || ""}`}
        style={style}
        title="Edit Footer"
        aria-label="Edit Footer"
      >
        <IconEdit />
        <span>Edit Footer</span>
      </button>

      {isEditing && isMounted && createPortal(
        <div
          className="edit-footer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCancel();
            }
          }}
        >
          <div className="edit-footer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-footer-modal-header">
              <h2>Edit Footer</h2>
              <button
                className="btn-icon"
                onClick={handleCancel}
                aria-label="Close"
                title="Close footer editor"
              >
                ✕
              </button>
            </div>

            <div className="edit-footer-modal-content">
              {/* Copyright Text */}
              <div className="edit-footer-section">
                <h3>Copyright Text</h3>
                <label className="edit-footer-field">
                  <span className="edit-footer-field-label">Copyright Text</span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="admin-input-text"
                    rows={2}
                    title="Copyright text"
                    placeholder="Enter copyright text"
                  />
                </label>
              </div>

              {/* Social Links */}
              <div className="edit-footer-section">
                <h3>Social Links</h3>
                <div className="edit-footer-items">
                  {socialLinks.map((link, i) => (
                    <div key={i} className="edit-footer-item">
                      <div className="edit-footer-item-fields">
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Social Media Title</span>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) =>
                              handleUpdateSocialLink(i, "label", e.target.value)
                            }
                            className="admin-input-text"
                            title="Social link label"
                            placeholder="Label (e.g., Facebook)"
                          />
                        </label>
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Link of Social Media</span>
                          <input
                            type="text"
                            value={link.href}
                            onChange={(e) =>
                              handleUpdateSocialLink(i, "href", e.target.value)
                            }
                            className="admin-input-text"
                            title="Social link URL"
                            placeholder="URL"
                          />
                        </label>
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Icon Type</span>
                          <select
                            value={link.icon}
                            onChange={(e) =>
                              handleUpdateSocialLink(i, "icon", e.target.value)
                            }
                            className="admin-input-text"
                            title="Social link icon type"
                          >
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="custom">Custom</option>
                          </select>
                        </label>
                        {link.icon === "custom" && (
                          <label className="edit-footer-field">
                            <span className="edit-footer-field-label">Custom Icon URL</span>
                            <input
                              type="text"
                              value={link.iconUrl || ""}
                              onChange={(e) =>
                                handleUpdateSocialLink(i, "iconUrl", e.target.value)
                              }
                              className="admin-input-text"
                              title="Custom social icon URL"
                              placeholder="Icon URL (for custom icon)"
                            />
                          </label>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => handleRemoveSocialLink(i)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline admin-add-btn"
                  onClick={handleAddSocialLink}
                  title="Add a social media link"
                >
                  <IconPlus /> Add Social Link
                </button>
              </div>

              {/* Badges */}
              <div className="edit-footer-section">
                <h3>Badges (Partnerships)</h3>
                <div className="edit-footer-items">
                  {badges.map((badge, i) => (
                    <div key={i} className="edit-footer-item">
                      <div className="edit-footer-item-fields">
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Badge Title</span>
                          <input
                            type="text"
                            value={badge.label}
                            onChange={(e) =>
                              handleUpdateBadge(i, "label", e.target.value)
                            }
                            className="admin-input-text"
                            title="Badge label"
                            placeholder="Badge label (e.g., Partner Name)"
                          />
                        </label>
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Link of Badge</span>
                          <input
                            type="text"
                            value={badge.href}
                            onChange={(e) =>
                              handleUpdateBadge(i, "href", e.target.value)
                            }
                            className="admin-input-text"
                            title="Badge link URL"
                            placeholder="Link URL"
                          />
                        </label>
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Badge Image URL</span>
                          <input
                            type="text"
                            value={badge.imageUrl || ""}
                            onChange={(e) =>
                              handleUpdateBadge(i, "imageUrl", e.target.value)
                            }
                            className="admin-input-text"
                            title="Badge image URL"
                            placeholder="Image URL"
                          />
                        </label>
                        <label className="edit-footer-field">
                          <span className="edit-footer-field-label">Badge Image Alt</span>
                          <input
                            type="text"
                            value={badge.imageAlt || ""}
                            onChange={(e) =>
                              handleUpdateBadge(i, "imageAlt", e.target.value)
                            }
                            className="admin-input-text"
                            title="Badge image alt text"
                            placeholder="Image alt text"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => handleRemoveBadge(i)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline admin-add-btn"
                  onClick={handleAddBadge}
                  title="Add a partnership badge"
                >
                  <IconPlus /> Add Badge
                </button>
              </div>
            </div>

            <div className="edit-footer-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Footer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
