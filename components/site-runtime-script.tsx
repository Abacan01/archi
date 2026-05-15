"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SiteRuntimeScript() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/studio")) {
      return;
    }

    const existingScript = document.getElementById("site-runtime-script");
    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = "site-runtime-script";
    script.src = "/script.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pathname]);

  return null;
}
