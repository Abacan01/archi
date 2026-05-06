import Image from "next/image";
import { getSiteContent } from "../../lib/content";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
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
              <aside className="about-achievements">
                <section className="about-side-block">
                  <p className="sidebar-eyebrow">Licenses</p>
                  <div className="about-chip-list">
                    {(about.licenseNumbers || []).map((item) => <span className="about-chip" key={item}>{item}</span>)}
                  </div>
                </section>

                <section className="about-side-block">
                  <p className="sidebar-eyebrow">Memberships</p>
                  <p className="about-membership-line">{(about.memberships || []).map((item) => item.title).filter(Boolean).join(" · ")}</p>
                </section>

                <section className="about-side-block">
                  <p className="sidebar-eyebrow">Specializations</p>
                  <div className="about-chip-list">
                    {(about.specializations || []).map((item) => <span className="about-chip" key={item}>{item}</span>)}
                  </div>
                </section>
              </aside>

              <div className="about-main-content">
                <section>
                  <p className="db-eyebrow">Services</p>
                  <div className="service-stack">
                    {(about.services || []).map((service) => (
                      <article className="service-row" key={service.title}>
                        <h4>{service.title}</h4>
                        {(service.paragraphs || []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="db-eyebrow">Architecture Design</p>
                  <div className="service-stack">
                    {(about.principles || []).map((paragraph) => (
                      <article className="service-row" key={paragraph}>
                        <blockquote className="design-philosophy-quote">
                          {paragraph}
                        </blockquote>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </article>
        </section>
      </main>

      <SiteFooter footer={global.footer} />
    </>
  );
}
