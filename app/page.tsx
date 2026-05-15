import Image from "next/image";
import { getSiteContent } from "../lib/content";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { InlineEditor } from "../components/inline-editor";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: { [key: string]: string | string[] };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const siteContent = await getSiteContent();
  const { home, global, projectItems } = siteContent;
  
  const editModeParam = searchParams?.editMode === "true" ? "?editMode=true" : "";

  const projects = projectItems || [];
  const featuredProject = projects[0];
  const heroMainImage = home.featuredDesign?.imageUrl || featuredProject?.coverImageUrl || "/assets/images/lgv.avif";
  const heroMainAlt = home.featuredDesign?.imageAlt || featuredProject?.coverImageAlt || featuredProject?.title || "Featured frontage architectural design";
  const heroMainTitle = home.featuredDesign?.title || featuredProject?.title || "Clean frontage studies";
  const heroMainCopy = home.featuredDesign?.description || (featuredProject
    ? featuredProject.descriptionText || `${featuredProject.category || ""}${featuredProject.year ? `, ${featuredProject.year}` : ""}.`
    : "Facade compositions that balance proportion, shade, and a clear architectural identity.");
  const heroParagraphs = home.paragraphs || [];
  const heroTiles = home.tiles || [];
  const heroActions = home.actions || [];
  return (
    <>
      <SiteHeader brand={global.brand} navItems={global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" suppressHydrationWarning />

      <main>
        <section className="hero section container" id="home">
          <div className="hero-copy reveal in-view">
            <InlineEditor as="p" className="eyebrow" path="home.eyebrow" initialValue={home.eyebrow} />
            <InlineEditor as="h1" path="home.title" initialValue={home.title} />
            {heroParagraphs.map((paragraph, index) => (
              <InlineEditor key={index} as="p" className="lead" path={`home.paragraphs[${index}]`} initialValue={paragraph} multiline />
            ))}
            <div className="hero-actions">
              {heroActions.map((action) => (
                <a
                  key={`${action.label}-${action.href}`}
                  className={action.variant === "primary" ? "btn btn-primary" : "btn btn-outline"}
                  href={action.href === "#projects" ? `/projects${editModeParam}` : action.href ? `${action.href}${editModeParam}` : "#"}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>

          <aside className="hero-showcase reveal in-view" aria-label="Featured designs">
            <article className="hero-showcase-main">
              <div className="hero-showcase-media">
                <InlineEditor 
                  type="image" 
                  path="home.featuredDesign.imageUrl" 
                  initialValue={heroMainImage} 
                />
              </div>
              <div className="hero-showcase-copy">
                <InlineEditor as="p" className="tag" path="home.featuredDesign.eyebrow" initialValue={home.featuredDesign?.eyebrow} />
                <InlineEditor as="h2" path="home.featuredDesign.title" initialValue={heroMainTitle} />
                <InlineEditor as="p" path="home.featuredDesign.description" initialValue={heroMainCopy} multiline />
              </div>
            </article>
            <div className="hero-showcase-grid">
              {heroTiles.map((tile, index) => (
                <article className="hero-showcase-tile" key={`${tile.title}-${tile.tag}`}>
                  <div className="hero-showcase-tile-media">
                    <InlineEditor 
                      type="image" 
                      path={`home.tiles[${index}].imageUrl`} 
                      initialValue={tile.imageUrl || "/assets/images/lgv.avif"} 
                    />
                  </div>
                  <div className="hero-showcase-tile-copy">
                    <InlineEditor as="p" className="tag" path={`home.tiles[${index}].tag`} initialValue={tile.tag} />
                    <InlineEditor as="h3" path={`home.tiles[${index}].title`} initialValue={tile.title} />
                    {tile.description ? <InlineEditor as="p" className="hero-showcase-tile-desc" path={`home.tiles[${index}].description`} initialValue={tile.description} multiline /> : null}
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter footer={global.footer} isEditMode={searchParams?.editMode === "true"} />
    </>
  );
}
