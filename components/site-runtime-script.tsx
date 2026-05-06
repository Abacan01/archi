"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function SiteRuntimeScript() {
  const pathname = usePathname();

  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return <Script src="/script.js" strategy="afterInteractive" />;
}
