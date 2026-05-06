import Image from "next/image";
import Link from "next/link";
import { getProjectBySlug, getSiteContent } from "../../../lib/content";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: { slug?: string | string[] };
};

export default async function ProjectDetailPage({ searchParams }: PageProps) {
  const siteContent = await getSiteContent();
  const rawSlug = searchParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || "";
  const project = slug ? await getProjectBySlug(slug) : null;
  const gallery = (project?.gallery || []).filter((item) => item.imageUrl);

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
            <p className="section-note">
              {project?.category || ""}
              {project?.year ? ` / ${project.year}` : ""}
              {project?.status ? ` / ${project.status}` : ""}
            </p>
          </div>

          {!slug ? (
            <p className="section-note">
              Choose a project from <Link href="/projects">Projects</Link> to view details.
            </p>
          ) : null}

          {!project && slug ? (
            <p className="section-note">
              Project details are not available. Please return to <Link href="/projects">Projects</Link>.
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
                <div className="project-grid" style={{ marginTop: "1rem" }}>
                  {gallery.map((item, index) => (
                    <article className="project-card" key={`${project.slug || project.title}-gallery-${index}`}>
                      <Image
                        src={item.imageUrl || "/assets/images/lgv.avif"}
                        alt={item.imageAlt || `${project.title} gallery ${index + 1}`}
                        width={960}
                        height={640}
                      />
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          <p className="section-note" style={{ marginTop: "1.2rem" }}>
            <Link href="/projects">Back to Projects</Link>
          </p>
        </section>
      </main>

      <SiteFooter footer={siteContent.global.footer} />
    </>
  );
}
