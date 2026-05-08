import { getSiteContent } from "../../lib/content";
import { defaultSiteContent } from "../../lib/content-defaults";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import { AddProjectButton } from "../../components/add-project-button";
import { ProjectsGrid } from "../../components/projects-grid";
import BulkDeleteTrigger from "../../components/bulk-delete-trigger";
import { SpotlightEditGrid } from "../../components/spotlight-edit-grid";
import type { ProjectItem, SpotlightPanel } from "../../lib/content-types";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: { [key: string]: string | string[] };
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const isEditMode = searchParams?.editMode === "true";
  const editModeParam = isEditMode ? "?editMode=true" : "";
  const siteContent = await getSiteContent();
  const content = siteContent.projectsPage;
  const projects: ProjectItem[] = siteContent.projectItems || [];
  const defaultProjectsContent = defaultSiteContent.projectsPage;

  const spotlight = content.spotlight || defaultProjectsContent.spotlight;
  const additionalPanels = [
    content.spotlightTwo,
    content.spotlightThree,
    content.spotlightFour,
    ...(content.additionalSpotlights ?? []),
  ].filter((panel): panel is SpotlightPanel => Boolean(
    panel && (
      panel.title ||
      panel.type ||
      panel.description ||
      panel.imageUrl ||
      panel.imageAlt ||
      (panel.points && panel.points.length)
    )
  ));

  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" />

      <main>
        <section className="section container reveal in-view" id="projects">
          <div className="section-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <InlineEditor as="h2" path="projectsPage.portfolioTitle" initialValue={content.portfolioTitle || defaultProjectsContent.portfolioTitle} />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <AddProjectButton
                isEditMode={isEditMode}
                compact
                label="+ Add New Project"
                style={{
                  marginTop: 0,
                  boxShadow: "0 14px 30px rgba(0, 0, 0, 0.28)",
                  backgroundColor: "rgba(88, 126, 69, 0.95)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.22)",
                }}
              />
              <BulkDeleteTrigger isEditMode={isEditMode} />
            </div>
          </div>

          {isEditMode && (
            <SpotlightEditGrid spotlight={spotlight} additionalPanels={additionalPanels} projects={projects} />
          )}

          <ProjectsGrid projects={projects} isEditMode={isEditMode} />

          <div id="carouselLightbox" className="carousel-lightbox" aria-hidden="true">
            <button className="carousel-lightbox-close" type="button" aria-label="Close full image view">&times;</button>
            <button className="carousel-lightbox-prev" type="button" aria-label="Previous image">&#10094;</button>
            <div className="carousel-lightbox-media">
              <img id="carouselLightboxImage" alt="" />
              <p id="carouselLightboxCaption" className="carousel-lightbox-caption" />
            </div>
            <button className="carousel-lightbox-next" type="button" aria-label="Next image">&#10095;</button>
          </div>
        </section>
      </main>

      <SiteFooter footer={siteContent.global.footer} />
    </>
  );
}
