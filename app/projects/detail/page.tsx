import Image from "next/image";
import Link from "next/link";
import { getProjectBySlug, getSiteContent } from "../../../lib/content";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { AddProjectButton } from "../../../components/add-project-button";
import { RemoveProjectButton } from "../../../components/remove-project-button";
import { GalleryView } from "../../../components/gallery-view";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: { slug?: string | string[]; editMode?: string | string[] };
};

export default async function ProjectDetailPage({ searchParams }: PageProps) {
  const siteContent = await getSiteContent();
  const rawSlug = searchParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || "";
  const project = slug ? await getProjectBySlug(slug) : null;
  const gallery = (project?.gallery || []).filter((item) => item.imageUrl);
  
  const editModeParam = searchParams?.editMode === "true" ? "?editMode=true" : "";
  const isEditMode = searchParams?.editMode === "true";
  const projects = siteContent.projectItems || [];
  const projectIndex = project ? projects.findIndex((p) => p.slug === project.slug) : -1;

  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" />

      <main>
        <section className="section container reveal" id="project-detail">
          <div className="section-head projects-head">
            <div>
              <p className="eyebrow">Project Detail</p>
              <h2>{project?.title || "Project"}</h2>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <p className="section-note" style={{ margin: 0 }}>
                {project?.category || ""}
                {project?.year ? ` / ${project.year}` : ""}
                {project?.status ? ` / ${project.status}` : ""}
              </p>
              {isEditMode ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <AddProjectButton isEditMode={true} compact label="+ Add New" />
                  {projectIndex >= 0 ? <RemoveProjectButton index={projectIndex} title={project?.title} isEditMode={true} /> : null}
                </div>
              ) : null}
            </div>
          </div>

          {!slug ? (
            <p className="section-note">
              Choose a project from <Link href={`/projects${editModeParam}`}>Projects</Link> to view details.
            </p>
          ) : null}

          {!project && slug ? (
            <p className="section-note">
              Project details are not available. Please return to <Link href={`/projects${editModeParam}`}>Projects</Link>.
            </p>
          ) : null}

          {project ? (
            <>
              <article className="project-spotlight">
                <Image
                  src={project.coverImageUrl || "/assets/images/lgv.avif"}
                  alt={project.coverImageAlt || project.title || "Project cover"}
                  width={1400}
                  height={900}
                  priority
                />
                <div className="project-spotlight-copy">
                  <p className="tag">Overview</p>
                  <h3>{project.title}</h3>
                  <p className="spotlight-description">
                    {project.descriptionText || "Project narrative is currently being prepared in the admin dashboard."}
                  </p>
                  <div className="spotlight-points">
                    {project.category ? <span>{project.category}</span> : null}
                    {project.location ? <span>{project.location}</span> : null}
                    {project.year ? <span>{project.year}</span> : null}
                  </div>
                </div>
              </article>

              {gallery.length > 0 ? (
                <div style={{ marginTop: "1rem" }}>
                  <GalleryView items={gallery} />
                </div>
              ) : null}
            </>
          ) : null}

          <p className="section-note" style={{ marginTop: "1.2rem" }}>
            <Link href={`/projects${editModeParam}`}>Back to Projects</Link>
          </p>
        </section>
      </main>

      <SiteFooter footer={siteContent.global.footer} />
    </>
  );
}
