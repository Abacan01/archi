import Image from "next/image";
import { getSiteContent } from "../../lib/content";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import { AboutAchievements } from "../../components/about-achievements";
import { AboutServices } from "../../components/about-services";
import { AboutPrinciples } from "../../components/about-principles";

export const dynamic = "force-dynamic";

type AboutPageProps = {
  searchParams?: { [key: string]: string | string[] };
};

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const isEditMode = searchParams?.editMode === "true";
  const siteContent = await getSiteContent();
  const { about, global } = siteContent;

  return (
    <>
      <SiteHeader brand={global.brand} navItems={global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" />

      <main>
        <section className="section container reveal" id="about">
          <div className="section-head">
            <InlineEditor as="h2" path="about.pageTitle" initialValue={about.pageTitle} />
          </div>
          <article className="about-panel about-unified">
            <header className="about-unified-head">
              <div className="about-head-avatar">
                <InlineEditor 
                  type="image" 
                  path="about.sidebarImageUrl" 
                  initialValue={about.sidebarImageUrl || "/assets/images/joseph-chua-portrait.jpg"} 
                />
              </div>
              <div className="about-head-copy">
                <InlineEditor as="h3" path="about.sidebarName" initialValue={about.sidebarName} />
                <InlineEditor as="p" path="about.sidebarSubtitle" initialValue={about.sidebarSubtitle} multiline />
              </div>
            </header>

            <div className="about-unified-body">
              <AboutAchievements about={about} isEditMode={isEditMode} />

              <div className="about-main-content">
                <AboutServices about={about} isEditMode={isEditMode} />

                <AboutPrinciples about={about} isEditMode={isEditMode} />
              </div>
            </div>
          </article>
        </section>
      </main>

      <SiteFooter footer={global.footer} />
    </>
  );
}
