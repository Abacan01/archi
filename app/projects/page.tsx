import Image from "next/image";
import Link from "next/link";
import { getSiteContent } from "../../lib/content";
import { defaultSiteContent } from "../../lib/content-defaults";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import type { ProjectItem, SpotlightPanel } from "../../lib/content-types";

export const dynamic = "force-dynamic";

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "Published";
  return status;
}

export default async function ProjectsPage() {
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
  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" />

      <main>
        <section className="section container reveal" id="projects">
          <div className="section-head">
            <InlineEditor as="h2" path="projectsPage.portfolioTitle" initialValue={content.portfolioTitle || defaultProjectsContent.portfolioTitle} />
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
            <div className="project-spotlight-copy">
              <InlineEditor as="h3" id="spotlightTitle" path="projectsPage.spotlight.title" initialValue={spotlight?.title || projects[0]?.title || "Mckinley West Residence"} />
              <InlineEditor as="p" id="spotlightType" className="spotlight-type" path="projectsPage.spotlight.type" initialValue={spotlight?.type || projects[0]?.category || "Residential"} />
              <InlineEditor as="p" id="spotlightDescription" className="spotlight-description" path="projectsPage.spotlight.description" initialValue={spotlight?.description} multiline />
              <div className="spotlight-points">
                {(spotlight?.points || []).map((point) => <span key={point}>{point}</span>)}
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

          {additionalPanels.map((panel, index) => {
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
                  <h3>{panel.title || fallbackProject?.title || "Featured Architecture"}</h3>
                  <p className="spotlight-type">{panel.type || fallbackProject?.category || "Residential"}</p>
                  <p className="spotlight-description">{panel.description || "Project details available on request."}</p>
                  <div className="spotlight-points">
                    {(panel.points || []).map((point) => <span key={`${point}-${index}`}>{point}</span>)}
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
          })}

          <div className="project-grid">
            {projects.map((project, index) => (
              <Link
                className="project-card"
                data-type={(project.category || "").toLowerCase()}
                data-stage={project.status === "Completed" || project.status === "Sold" ? "accomplished" : "rendered"}
                key={project.slug || project.title || project.id || String(index)}
                href={project.slug ? `/projects/detail?slug=${encodeURIComponent(project.slug)}` : "/projects"}
                aria-label={`Open ${project.title}`}
              >
                {project.coverImageUrl ? (
                  <Image src={project.coverImageUrl} alt={project.coverImageAlt || project.title || "Project image"} width={960} height={640} />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "16 / 10", background: "rgba(255,255,255,0.06)" }} />
                )}
                <div>
                  <p className="tag">{project.category}</p>
                  <p className={`status-pill ${project.status === "Completed" || project.status === "Sold" ? "status-pill-accomplished" : "status-pill-rendered"}`}>
                    {getStatusLabel(project.status || null)}
                  </p>
                  <h3>{project.title}</h3>
                </div>
              </Link>
            ))}
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
