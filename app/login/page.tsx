"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db, isFirebaseConfigured } from "../../lib/firebase/client";
import { SiteHeader } from "../../components/site-header";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    return onAuthStateChanged(auth, async (current) => {
      if (!current || !db) {
        setIsAdmin(false);
        return;
      }
      const adminSnap = await getDoc(doc(db, "admins", current.uid));
      const hasAdmin = adminSnap.exists();
      setIsAdmin(hasAdmin);
      if (hasAdmin) {
        router.push("/admin");
      }
    });
  }, [router]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!auth) return;
    setIsBusy(true);
    setStatus(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      setStatus("Signed in. Redirecting to admin...");
      router.push("/admin");
    } catch (error) {
      setStatus("Login failed. Check your credentials.");
    } finally {
      setIsBusy(false);
    }
  }

  const helperMessage = useMemo(() => {
    if (!isFirebaseConfigured) {
      return "Firebase env vars are missing. Add them to .env and restart the dev server.";
    }
    if (isAdmin) {
      return "You already have admin access. Redirecting...";
    }
    return "Use your admin email to sign in.";
  }, [isAdmin]);

  return (
    <>
      <SiteHeader />
      <main className="auth-page container">
        <section className="auth-card">
          <header className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-mark">JC</span>
              <div>
                <p className="auth-logo-title">JCCHUA Admin</p>
                <p className="auth-logo-subtitle">Secure access portal</p>
              </div>
            </div>
            <h1>Welcome back</h1>
            <p className="auth-lede">Sign in to manage portfolio content and updates.</p>
          </header>

          <div className="auth-alert" role="status">
            <IconShield />
            <span>{helperMessage}</span>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-field">
              Email
              <div className="auth-input">
                <span className="auth-input-icon"><IconUser /></span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <label className="auth-field">
              Password
              <div className="auth-input">
                <span className="auth-input-icon"><IconKey /></span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={isBusy}>
              <IconLogin />
              Sign In
            </button>
          </form>

          {status ? <p className="auth-status">{status}</p> : null}
        </section>

        <aside className="auth-panel">
          <div className="auth-panel-card">
            <h2>Quick tips</h2>
            <ul>
              <li>Use the JSON editor to update text, links, and media.</li>
              <li>Upload images first, then paste the URL into content.</li>
              <li>Need access? Ask the site owner to add your UID to admins.</li>
            </ul>
          </div>
          <div className="auth-panel-card auth-panel-muted">
            <h3>Safety</h3>
            <p>Only approved admin accounts can save changes to the site content.</p>
          </div>
        </aside>
      </main>
    </>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 14a5 5 0 1 1 4.8-6H22v4h-2v2h-2v2h-4.2A5 5 0 0 1 7 14Zm0-2a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 4h-2v6H4v4h7v6h2V4Zm3 0h4v16h-4v-2h2V6h-2V4Z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 20 5v6c0 5.1-3.4 9.6-8 11-4.6-1.4-8-5.9-8-11V5l8-3Zm0 4-4 1.5V11c0 3.4 1.9 6.5 4 7.8 2.1-1.3 4-4.4 4-7.8V7.5L12 6Z" />
    </svg>
  );
}
