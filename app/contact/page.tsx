import { getSiteContent } from "../../lib/content";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { InlineEditor } from "../../components/inline-editor";
import { ContactCard } from "../../components/contact-card";

export const dynamic = "force-dynamic";

type ContactPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = await searchParams;
  const isEditMode = resolvedSearchParams?.editMode === "true";
  const siteContent = await getSiteContent();
  const contact = siteContent.contact;
  return (
    <>
      <SiteHeader brand={siteContent.global.brand} navItems={siteContent.global.navItems} />
      <div className="top-progress" id="topProgress" aria-hidden="true" suppressHydrationWarning />

      <main>
        <section className="section container reveal" id="contact">
          <div className="section-head">
            <InlineEditor as="h2" path="contact.title" initialValue={contact.title} />
          </div>
          <div className="contact-layout">
            <form id="contactForm" className="contact-form" noValidate>
              <div className="contact-form-head">
                <InlineEditor as="h3" path="contact.formTitle" initialValue={contact.formTitle} />
                <InlineEditor as="p" path="contact.formIntro" initialValue={contact.formIntro} multiline />
              </div>
              <div className="form-grid">
                <label>
                  Name *
                  <input type="text" name="name" autoComplete="name" placeholder="First Name and Last Name" required />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" autoComplete="email" placeholder="example@gmail.com" required />
                </label>
                <label>
                  Mobile Number *
                  <input type="tel" name="mobile" autoComplete="tel" required />
                </label>
                <label>
                  Subject
                  <input type="text" name="subject" placeholder="Project consultation request" />
                </label>
                <label>
                  Project Type *
                  <select name="type" required>
                    <option value="">Select one</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </label>
                <label>
                  Service Needed *
                  <select name="service" required>
                    <option value="">Select one</option>
                    <option value="architectural-design">Architectural Design</option>
                    <option value="design-build">Design-Build</option>
                    <option value="master-planning">Master Planning</option>
                    <option value="green-architecture">Green Architecture</option>
                    <option value="consulting">Technical Consulting</option>
                  </select>
                </label>
                <label className="field-wide">
                  Province *
                  <input
                    type="text"
                    name="provinceCity"
                    list="provinceCitySuggestions"
                    autoComplete="off"
                    placeholder="Select your province"
                    required
                  />
                  <datalist id="provinceCitySuggestions"></datalist>
                </label>
                <p className="address-hint field-wide" id="addressHint">Choose a province first. The next fields unlock based on your selection.</p>
                <label>
                  Municipality / City
                  <input
                    type="text"
                    name="municipalityCity"
                    list="municipalitySuggestions"
                    autoComplete="off"
                    placeholder="Choose after province"
                    disabled
                  />
                  <datalist id="municipalitySuggestions"></datalist>
                </label>
                <label>
                  Barangay *
                  <input
                    type="text"
                    name="barangay"
                    list="barangaySuggestions"
                    autoComplete="off"
                    placeholder="Choose after municipality/city"
                    required
                    disabled
                  />
                  <datalist id="barangaySuggestions"></datalist>
                </label>
                <label>
                  Postal Code *
                  <input type="text" name="postalCode" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{4}" maxLength={4} placeholder="1300" required />
                </label>
                <label className="field-wide">
                  Additional Address Details
                  <textarea name="addressDetails" rows={3} placeholder="Street name, house number, barangay, building, landmark..." />
                </label>
                <label className="field-wide">
                  Message *
                  <textarea name="message" rows={6} required />
                </label>
              </div>
              <button className="btn btn-primary" type="submit">Send Inquiry</button>
              <p id="formMessage" className="form-message" aria-live="polite"></p>
            </form>

            <div className="contact-side">
              <aside className="contact-card map-card" aria-label="Office map location">
                <InlineEditor as="h3" path="contact.officeHeading" initialValue={contact.officeHeading} />
                <div className="contact-map-wrap">
                  <iframe
                    title="JCCHUA and Associates office map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={contact.officeMapUrl}
                  />
                  <p className="map-link">
                    <a href={contact.officeMapLinkUrl} target="_blank" rel="noopener noreferrer"><InlineEditor path="contact.officeMapLink" initialValue={contact.officeMapLink} /></a>
                  </p>
                </div>
              </aside>

              <ContactCard contact={contact} isEditMode={isEditMode} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter footer={siteContent.global.footer} isEditMode={isEditMode} />
    </>
  );
}
