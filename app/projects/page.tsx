"use client";

import { useSearchParams } from "next/navigation";
import { defaultSiteContent } from "../../lib/content-defaults";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import { AddProjectButton } from "../../components/add-project-button";
import { ProjectsGrid } from "../../components/projects-grid";
import BulkDeleteTrigger from "../../components/bulk-delete-trigger";
import { SpotlightEditGrid } from "../../components/spotlight-edit-grid";
import { useEditSession } from "../../components/edit-session-provider";
import { showToast } from "../../components/toast";
import type { ProjectItem, SpotlightPanel } from "../../lib/content-types";
import { useLiveSiteContent } from "../../components/use-live-site-content";

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("editMode") === "true";
  const editModeParam = isEditMode ? "?editMode=true" : "";
  const siteContent = useLiveSiteContent(defaultSiteContent);
  const content = siteContent.projectsPage;
  const projects: ProjectItem[] = siteContent.projectItems || [];
  const defaultProjectsContent = defaultSiteContent.projectsPage;
  const session = useEditSession();

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
      <div className="top-progress" id="topProgress" aria-hidden="true" suppressHydrationWarning />

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
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.25)",
                  backgroundColor: "rgba(76, 175, 80, 0.9)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.25)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.3px",
                  padding: "0.6rem 1.4rem",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              <BulkDeleteTrigger isEditMode={isEditMode} />
              {isEditMode ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Discard ALL drafts? This cannot be undone.")) return;
                    try {
                      await session.cancelAllDrafts();
                      showToast("All drafts discarded.", "success");
                    } catch (err) {
                      console.error(err);
                      showToast("Failed to discard drafts.", "error");
                    }
                  }}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Discard Drafts
                </button>
              ) : null}
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

      <SiteFooter footer={siteContent.global.footer} isEditMode={isEditMode} />
    </>
  );
}
