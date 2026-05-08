"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { auth, db, isFirebaseConfigured, storage } from "../../lib/firebase/client";
import { defaultSiteContent } from "../../lib/content-defaults";
import type { SiteContent } from "../../lib/content-types";
import { IconUser, IconKey, IconLogin, IconLogout, IconUpload, IconSave, IconSeed, IconShield, IconCheck, IconAlert, IconInfo, IconHistory, IconTrash, IconEdit } from "./icons";

const CONTENT_DOC = "main";
const CONTENT_COLLECTION = "siteContent";

export const dynamic = "force-dynamic";

type ToastTone = "success" | "error" | "info";

type ToastMessage = {
  message: string;
  tone: ToastTone;
};

type ModalState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "info";
  onConfirm: () => void;
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contentData, setContentData] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [uploadPath, setUploadPath] = useState("site-content");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadTargetCallback, setUploadTargetCallback] = useState<((url: string) => void) | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryName, setEditingHistoryName] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!auth || !db) return;
    return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (!current || !db) {
        setIsAdmin(false);
        return;
      }

      const firestore = db;
      if (!firestore) {
        setIsAdmin(false);
        return;
      }

      const adminSnap = await getDoc(doc(firestore, "admins", current.uid));
      setIsAdmin(adminSnap.exists());
    });
  }, []);

  const canEdit = Boolean(user && isAdmin);

  useEffect(() => {
    if (!canEdit) return;
    void loadContent();
  }, [canEdit]);

  async function loadContent() {
    if (!db) return;
    setIsBusy(true);
    setJsonError(null);
    try {
      const snap = await getDoc(doc(db, CONTENT_COLLECTION, CONTENT_DOC));
      const data = snap.exists() ? (snap.data() as SiteContent) : defaultSiteContent;
      setContentData(data);
    } catch (error) {
      showToast("Failed to load content.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!auth) return;
    setIsBusy(true);
    setJsonError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      showToast("Welcome back.", "success");
    } catch (error) {
      showToast("Login failed. Check your credentials.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    if (!auth) return;
    await signOut(auth);
    showToast("Signed out.", "info");
    router.push("/login");
  }

  function openModal(next: ModalState) {
    setModal(next);
  }

  function closeModal() {
    setModal(null);
  }

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone });
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
  }, []);

  async function loadHistory() {
    if (!db) return;
    setShowHistory(true);
    setIsBusy(true);
    try {
      const q = query(collection(db, "siteHistory"), orderBy("timestamp", "desc"), limit(20));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistoryItems(items);
    } catch (error) {
      showToast("Failed to load history.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreHistory(data: any) {
    if (!db) return;
    if (!window.confirm("Restore this version to the live site immediately?")) return;
    setIsBusy(true);
    setJsonError(null);
    try {
      await setDoc(doc(db, CONTENT_COLLECTION, CONTENT_DOC), data, { merge: false });
      setContentData(data);
      setShowHistory(false);
      showToast("Version restored to the live site.", "success");
    } catch (error) {
      setJsonError("Restore failed.");
      showToast("Restore failed.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteHistory(id: string) {
    if (!db) return;
    if (!window.confirm("Delete this history version?")) return;
    setIsBusy(true);
    try {
      await deleteDoc(doc(db, "siteHistory", id));
      setHistoryItems(items => items.filter(i => i.id !== id));
      showToast("History deleted.", "success");
    } catch (error) {
      showToast("Failed to delete.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteProject(index: number, title?: string) {
    if (!db || !contentData) return;
    if (!window.confirm(`Delete ${title || "this project"}?`)) return;

    setIsBusy(true);
    try {
      const contentRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC);
      const snap = await getDoc(contentRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const currentProjects = Array.isArray(data.projectItems) ? [...data.projectItems] : [];
      if (index < 0 || index >= currentProjects.length) return;

      currentProjects.splice(index, 1);

      const nextData = {
        ...data,
        projectItems: currentProjects,
      };

      await setDoc(contentRef, nextData, { merge: false });

      const historyRef = doc(collection(db, "siteHistory"));
      await setDoc(historyRef, {
        timestamp: serverTimestamp(),
        data: nextData,
        author: "Admin (Delete Project)",
      });

      setContentData(nextData);
      showToast("Project deleted.", "success");
    } catch (error) {
      showToast("Failed to delete project.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveHistoryName(id: string) {
    if (!db) return;
    setIsBusy(true);
    try {
      await updateDoc(doc(db, "siteHistory", id), { name: editingHistoryName });
      setHistoryItems(items => items.map(i => i.id === id ? { ...i, name: editingHistoryName } : i));
      setEditingHistoryId(null);
      showToast("Version renamed.", "success");
    } catch (error) {
      showToast("Failed to rename.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSeedDefaults() {
    if (!db) return;
    setIsBusy(true);
    setJsonError(null);
    try {
      await setDoc(doc(db, CONTENT_COLLECTION, CONTENT_DOC), defaultSiteContent, { merge: false });
      setContentData(defaultSiteContent);
      showToast("Defaults seeded.", "success");
    } catch (error) {
      showToast("Seeding failed.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!storage) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    setJsonError(null);
    try {
      const safeName = file.name.replace(/\s+/g, "-");
      // eslint-disable-next-line react-hooks/purity
      const fullPath = `${uploadPath}/${Date.now()}-${safeName}`;
      const fileRef = ref(storage, fullPath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setUploadUrl(url);
      if (uploadTargetCallback) {
        uploadTargetCallback(url);
        setUploadTargetCallback(null);
      }
      showToast("Upload complete.", "success");
    } catch (error) {
      showToast("Upload failed.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopyUploadUrl() {
    if (!uploadUrl) return;
    try {
      await navigator.clipboard.writeText(uploadUrl);
      showToast("Copied URL to clipboard.", "success");
    } catch (error) {
      showToast("Copy failed. Select and copy manually.", "error");
    }
  }

  function confirmSeedDefaults() {
    openModal({
      title: "Reset to defaults",
      message: "This will overwrite current content with the starter content. Continue?",
      confirmLabel: "Seed defaults",
      tone: "danger",
      onConfirm: () => {
        closeModal();
        void handleSeedDefaults();
      },
    });
  }

  function confirmLogout() {
    openModal({
      title: "Sign out",
      message: "You will be signed out of the admin dashboard.",
      confirmLabel: "Sign out",
      tone: "info",
      onConfirm: () => {
        closeModal();
        void handleLogout();
      },
    });
  }

  const authMessage = useMemo(() => {
    if (!isFirebaseConfigured) {
      return "Firebase env vars are missing. Add them to .env and restart the dev server.";
    }
    if (!user) {
      return "Sign in with your admin account.";
    }
    if (!isAdmin) {
      return "You are signed in but not an admin. Add your UID to admins/{uid} in Firestore.";
    }
    return "";
  }, [user, isAdmin]);

  return (
    <main className="admin-page container">
      <header className="admin-hero">
        <div>
          <div className="admin-brand">
            <span className="admin-brand-mark">JC</span>
            <div>
              <p className="admin-brand-title">JCCHUA Admin</p>
              <p className="admin-brand-subtitle">Portfolio control room</p>
            </div>
          </div>
          <h1>Admin Dashboard</h1>
          <p className="admin-lede">Update content, upload media, and keep the portfolio current.</p>
        </div>
        <div className="admin-hero-actions">
          {user ? (
            <button className="btn btn-outline" type="button" onClick={confirmLogout}>
              <IconLogout />
              Sign Out
            </button>
          ) : null}
        </div>
      </header>

      <section className="admin-card admin-auth-card">
        <div className="admin-card-head">
          <div>
            <p className="admin-chip">Access</p>
            <h2>Secure Login</h2>
            <p className="admin-note">{authMessage || "Use your admin email and password."}</p>
          </div>
          <div className="admin-icon-wrap">
            <IconShield />
          </div>
        </div>

        {!user ? (
          <form className="admin-form" onSubmit={handleLogin}>
            <label className="admin-field">
              Email
              <div className="admin-input">
                <span className="admin-input-icon"><IconUser /></span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <label className="admin-field">
              Password
              <div className="admin-input">
                <span className="admin-input-icon"><IconKey /></span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </label>
            <button className="btn btn-primary" type="submit" disabled={isBusy}>
              <IconLogin />
              Sign In
            </button>
          </form>
        ) : (
          <div className="admin-actions">
            <p className="admin-note">Signed in as {user.email || user.uid}</p>
            <div className="admin-inline-actions">
              <button className="btn btn-outline" type="button" onClick={confirmLogout}>
                <IconLogout />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </section>

      {canEdit ? (
        <section className="admin-cms-section">
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <p className="admin-chip">Control Panel</p>
                <h2>Management</h2>
                <p className="admin-note">Manage site history and system settings. Edit content directly on the website pages.</p>
              </div>
              <div className="admin-actions" style={{ flexDirection: "row", display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline" type="button" onClick={loadHistory} disabled={isBusy}>
                  <IconHistory /> View Version History
                </button>
                <button className="btn btn-outline" type="button" onClick={confirmSeedDefaults} disabled={isBusy}>
                  <IconSeed /> Reset to Defaults
                </button>
                <a href="/?editMode=true" className="btn btn-primary">
                  Go to Website (Edit Mode)
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {canEdit ? (
        <section className="admin-cms-section"></section>
      ) : null}

      {toast ? (
        <div className={`admin-toast admin-toast-${toast.tone}`} role="status" aria-live="polite">
          <span className="admin-toast-icon">
            {toast.tone === "success" ? <IconCheck /> : null}
            {toast.tone === "error" ? <IconAlert /> : null}
            {toast.tone === "info" ? <IconInfo /> : null}
          </span>
          <span>{toast.message}</span>
        </div>
      ) : null}

      {modal ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-head">
              <span className={`admin-modal-icon ${modal.tone === "danger" ? "danger" : "info"}`}>
                {modal.tone === "danger" ? <IconAlert /> : <IconInfo />}
              </span>
              <div>
                <h3>{modal.title}</h3>
                <p>{modal.message}</p>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-outline" type="button" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" type="button" onClick={modal.onConfirm}>{modal.confirmLabel}</button>
            </div>
          </div>
        </div>
      ) : null}

      {showHistory ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" style={{ zIndex: 100 }}>
          <div className="admin-modal" style={{ maxWidth: "600px", width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="admin-modal-head">
              <span className="admin-modal-icon info"><IconHistory /></span>
              <div>
                <h3>Version history</h3>
                <p>View or restore previous versions of site content.</p>
              </div>
            </div>
            <div className="admin-modal-body" style={{ overflowY: "auto", flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {isBusy && historyItems.length === 0 ? <p>Loading history...</p> : null}
              {!isBusy && historyItems.length === 0 ? <p>No history found.</p> : null}
              {historyItems.map((item) => {
                const date = item.timestamp?.toDate ? item.timestamp.toDate() : null;
                const isEditing = editingHistoryId === item.id;
                
                return (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <input 
                            type="text" 
                            value={editingHistoryName} 
                            onChange={(e) => setEditingHistoryName(e.target.value)} 
                            style={{ background: "rgba(255,255,255,0.1)", color: "inherit", padding: "0.25rem 0.5rem", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "4px", flex: 1 }}
                            placeholder="Version name"
                            autoFocus
                          />
                          <button className="btn btn-primary" type="button" onClick={() => saveHistoryName(item.id)} style={{ padding: "0.25rem 0.75rem" }}>Save</button>
                          <button className="btn btn-outline" type="button" onClick={() => setEditingHistoryId(null)} style={{ padding: "0.25rem 0.75rem" }}>Cancel</button>
                        </div>
                      ) : (
                        <p style={{ fontWeight: "bold", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          {item.name || (date ? date.toLocaleString() : "Unknown time")}
                          {!item.name && <span style={{ fontWeight: "normal", fontSize: "0.8rem", opacity: 0.5 }}>(Auto-saved)</span>}
                          {item.name && date && <span style={{ fontWeight: "normal", fontSize: "0.8rem", opacity: 0.5 }}>({date.toLocaleString()})</span>}
                        </p>
                      )}
                      <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>{item.author}</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {!isEditing && (
                        <button className="btn btn-outline" type="button" onClick={() => { setEditingHistoryId(item.id); setEditingHistoryName(item.name || ""); }} title="Rename" style={{ padding: "0.5rem" }}>
                          <IconEdit />
                        </button>
                      )}
                      <button className="btn btn-outline" type="button" onClick={() => restoreHistory(item.data)} title="Restore" style={{ padding: "0.5rem 1rem" }}>
                        Restore
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => deleteHistory(item.id)} title="Delete" style={{ padding: "0.5rem", borderColor: "rgba(255,100,100,0.5)", color: "rgb(255,150,150)" }}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-outline" type="button" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

