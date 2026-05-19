"use client";

import { useSearchParams } from "next/navigation";
import { defaultSiteContent } from "../../lib/content-defaults";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { GalleryView } from "../../components/gallery-view";
import { useLiveSiteContent } from "../../components/use-live-site-content";

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const siteContent = useLiveSiteContent(defaultSiteContent);
  const items = siteContent.gallery.items || [];

  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" suppressHydrationWarning />

      <main>
        <section className="section container gallery-view-page" id="gallery-view">
          <GalleryView items={items} />
        </section>
      </main>

      <SiteFooter footer={siteContent.global.footer} isEditMode={searchParams.get("editMode") === "true"} />
    </>
  );
}
