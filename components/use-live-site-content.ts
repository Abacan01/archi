"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { defaultSiteContent } from "../lib/content-defaults";
import { mergeSiteContent } from "../lib/content-merge";
import type { SiteContent } from "../lib/content-types";

export function useLiveSiteContent(initialContent: SiteContent = defaultSiteContent) {
  const [content, setContent] = useState<SiteContent>(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (!db) return;

    const contentRef = doc(db, "siteContent", "main");
    return onSnapshot(contentRef, (snapshot) => {
      if (!snapshot.exists()) {
        setContent(initialContent);
        return;
      }

      setContent(mergeSiteContent(snapshot.data() as Partial<SiteContent>));
    });
  }, [initialContent]);

  return content;
}