import { getSiteContent } from "../../lib/content";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { GalleryView } from "../../components/gallery-view";

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  searchParams?: { [key: string]: string | string[] };
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const siteContent = await getSiteContent();
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

      <SiteFooter footer={siteContent.global.footer} isEditMode={searchParams?.editMode === "true"} />
    </>
  );
}
