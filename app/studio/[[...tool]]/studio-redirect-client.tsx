"use client";

import { useEffect } from "react";

export function StudioRedirectClient() {
  useEffect(() => {
    window.location.replace("/admin");
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <p style={{ marginBottom: "0.75rem" }}>Redirecting to the dashboard...</p>
        <a href="/admin">Continue to dashboard</a>
      </div>
    </main>
  );
}
