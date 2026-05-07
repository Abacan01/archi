import Image from "next/image";
import Link from "next/link";
import { getSiteContent } from "../../lib/content";
import { defaultSiteContent } from "../../lib/content-defaults";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import { AddProjectButton } from "../../components/add-project-button";
import { RemoveProjectButton } from "../../components/remove-project-button";
import type { ProjectItem, SpotlightPanel } from "../../lib/content-types";

export const dynamic = "force-dynamic";

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "Published";
  return status;
}

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
  const filterLabels = content.filterLabels?.length ? content.filterLabels : defaultProjectsContent.filterLabels || [];
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

  const renderSpotlightPanel = (panel: SpotlightPanel, index: number) => {
    const fallbackProject = projects[index] || projects[0];
    const isImageRight = index % 2 === 0;

    return (
      <article className={`project-spotlight${isImageRight ? " is-image-right" : ""}`} aria-live="polite" key={`${panel.title || "panel"}-${index}`}>
        <div className="project-spotlight-media" style={{ position: "relative", height: "100%" }}>
          <Image
            src={panel.imageUrl || fallbackProject?.coverImageUrl || "/assets/images/mckinley-west-residence.jpg"}
            alt={panel.imageAlt || fallbackProject?.coverImageAlt || "Project image"}
            fill
            sizes="(max-width: 940px) 100vw, 55vw"
            style={{ objectFit: "cover", objectPosition: "50% 50%" }}
          />
        </div>
        <div className="project-spotlight-copy">
          <InlineEditor as="h3" path={`projectsPage.${index === 0 ? "spotlight" : index === 1 ? "spotlightTwo" : index === 2 ? "spotlightThree" : "spotlightFour"}.title`} initialValue={panel.title || fallbackProject?.title || "Featured Architecture"} />
          <InlineEditor as="p" className="spotlight-type" path={`projectsPage.${index === 0 ? "spotlight" : index === 1 ? "spotlightTwo" : index === 2 ? "spotlightThree" : "spotlightFour"}.type`} initialValue={panel.type || fallbackProject?.category || "Residential"} />
          <InlineEditor as="p" className="spotlight-description" path={`projectsPage.${index === 0 ? "spotlight" : index === 1 ? "spotlightTwo" : index === 2 ? "spotlightThree" : "spotlightFour"}.description`} initialValue={panel.description || "Project details available on request."} multiline />
          <div className="spotlight-points">
            {(panel.points || []).map((point, pointIndex) => (
              <InlineEditor key={`${point}-${index}`} as="span" path={`projectsPage.${index === 0 ? "spotlight" : index === 1 ? "spotlightTwo" : index === 2 ? "spotlightThree" : "spotlightFour"}.points[${pointIndex}]`} initialValue={point} />
            ))}
          </div>
          {panel.moreDetailsUrl && (
            <a
              className="spotlight-more-link"
              href={panel.moreDetailsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              More Details
            </a>
          )}
        </div>
      </article>
    );
  };

  const renderProjectCard = (project: ProjectItem, index: number) => {
    return (
      <article className="project-card project-card-display" data-type={(project.category || "").toLowerCase()} data-stage={project.status === "Completed" || project.status === "Sold" ? "accomplished" : "rendered"} key={project.slug || project.title || project.id || String(index)}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
          {project.coverImageUrl ? (
            <InlineEditor type="image" path={`projectItems[${index}].coverImageUrl`} initialValue={project.coverImageUrl} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
              No cover image
            </div>
          )}
        </div>
        <div>
          <InlineEditor as="p" className="tag" path={`projectItems[${index}].category`} initialValue={project.category} />
          <InlineEditor as="p" className={`status-pill ${project.status === "Completed" || project.status === "Sold" ? "status-pill-accomplished" : "status-pill-rendered"}`} path={`projectItems[${index}].status`} initialValue={project.status || "Published"} />
          <InlineEditor as="h3" path={`projectItems[${index}].title`} initialValue={project.title} />
          <InlineEditor as="p" className="spotlight-description" path={`projectItems[${index}].descriptionText`} initialValue={project.descriptionText || ""} multiline />
          {isEditMode && (
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-start" }}>
              <RemoveProjectButton index={index} title={project.title} isEditMode={isEditMode} />
            </div>
          )}
        </div>
      </article>
    );
  };
  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" />

      <main>
        <section className="section container reveal" id="projects">
          <div className="section-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <InlineEditor as="h2" path="projectsPage.portfolioTitle" initialValue={content.portfolioTitle || defaultProjectsContent.portfolioTitle} />
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
            <div className="project-filter-tabs" style={{ display: "none" }}>
              {filterLabels.map((label, i) => {
                const filterValue = i === 0 ? "all" : label.toLowerCase();
                return (
                  <button
                    key={filterValue}
                    className={`filter-tab ${i === 0 ? "active" : ""}`}
                    data-filter={filterValue}
                    aria-pressed={i === 0 ? "true" : "false"}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <article className="project-spotlight" aria-live="polite">
            <div className="project-spotlight-media" style={{ position: "relative", height: "100%" }}>
              <Image
                id="spotlightImage"
                src={spotlight?.imageUrl || projects[0]?.coverImageUrl || "/assets/images/mckinley-west-residence.jpg"}
                alt={spotlight?.imageAlt || "Featured project image"}
                fill
                sizes="(max-width: 940px) 100vw, 55vw"
                style={{ objectFit: "cover", objectPosition: "50% 50%" }}
              />
            </div>
            <div className="project-spotlight-copy" style={{ position: "relative" }}>
              <div>
                <InlineEditor as="h3" id="spotlightTitle" path="projectsPage.spotlight.title" initialValue={spotlight?.title || projects[0]?.title || "Mckinley West Residence"} />
                <InlineEditor as="p" id="spotlightType" className="spotlight-type" path="projectsPage.spotlight.type" initialValue={spotlight?.type || projects[0]?.category || "Residential"} />
              </div>
              <InlineEditor as="p" id="spotlightDescription" className="spotlight-description" path="projectsPage.spotlight.description" initialValue={spotlight?.description} multiline />
              <div className="spotlight-points">
                {(spotlight?.points || []).map((point, idx) => <InlineEditor as="span" key={idx} path={`projectsPage.spotlight.points[${idx}]`} initialValue={point} />)}
              </div>
              {spotlight?.moreDetailsUrl && (
                <a
                  className="spotlight-more-link"
                  href={spotlight.moreDetailsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  More Details
                </a>
              )}
            </div>
          </article>

          {additionalPanels.map((panel, index) => renderSpotlightPanel(panel, index + 1))}

          <div className="project-grid">
            {projects.map((project, index) => renderProjectCard(project, index))}
          </div>

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
