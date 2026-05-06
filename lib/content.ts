import { adminDb } from "./firebase/admin";
import { defaultSiteContent } from "./content-defaults";
import type { SiteContent } from "./content-types";

const COLLECTION = "siteContent";
const DOC_ID = "main";

const mergeList = <T>(value: T[] | undefined, fallback: T[]) =>
  Array.isArray(value) ? value : fallback;

export function mergeSiteContent(data?: Partial<SiteContent>): SiteContent {
  return {
    ...defaultSiteContent,
    ...data,
    global: {
      ...defaultSiteContent.global,
      ...(data?.global ?? {}),
      brand: { ...defaultSiteContent.global.brand, ...(data?.global?.brand ?? {}) },
      navItems: mergeList(data?.global?.navItems, defaultSiteContent.global.navItems),
      footer: {
        ...defaultSiteContent.global.footer,
        ...(data?.global?.footer ?? {}),
        socialLinks: mergeList(
          data?.global?.footer?.socialLinks,
          defaultSiteContent.global.footer.socialLinks
        ),
        badges: mergeList(
          data?.global?.footer?.badges,
          defaultSiteContent.global.footer.badges
        ),
      },
    },
    home: {
      ...defaultSiteContent.home,
      ...(data?.home ?? {}),
      paragraphs: mergeList(data?.home?.paragraphs, defaultSiteContent.home.paragraphs || []),
      actions: mergeList(data?.home?.actions, defaultSiteContent.home.actions || []),
      tiles: mergeList(data?.home?.tiles, defaultSiteContent.home.tiles || []),
      featuredDesign: {
        ...defaultSiteContent.home.featuredDesign,
        ...(data?.home?.featuredDesign ?? {}),
      },
    },
    about: {
      ...defaultSiteContent.about,
      ...(data?.about ?? {}),
      licenseNumbers: mergeList(data?.about?.licenseNumbers, defaultSiteContent.about.licenseNumbers || []),
      specializations: mergeList(
        data?.about?.specializations,
        defaultSiteContent.about.specializations || []
      ),
      profileParagraphs: mergeList(
        data?.about?.profileParagraphs,
        defaultSiteContent.about.profileParagraphs || []
      ),
      profilePills: mergeList(data?.about?.profilePills, defaultSiteContent.about.profilePills || []),
      keyLicenses: mergeList(data?.about?.keyLicenses, defaultSiteContent.about.keyLicenses || []),
      memberships: mergeList(data?.about?.memberships, defaultSiteContent.about.memberships || []),
      principles: mergeList(data?.about?.principles, defaultSiteContent.about.principles || []),
      services: mergeList(data?.about?.services, defaultSiteContent.about.services || []),
      award: { ...defaultSiteContent.about.award, ...(data?.about?.award ?? {}) },
    },
    projectsPage: {
      ...defaultSiteContent.projectsPage,
      ...(data?.projectsPage ?? {}),
      filterLabels: mergeList(
        data?.projectsPage?.filterLabels,
        defaultSiteContent.projectsPage.filterLabels || []
      ),
      spotlight: {
        ...defaultSiteContent.projectsPage.spotlight,
        ...(data?.projectsPage?.spotlight ?? {}),
      },
      spotlightTwo: {
        ...defaultSiteContent.projectsPage.spotlightTwo,
        ...(data?.projectsPage?.spotlightTwo ?? {}),
      },
      spotlightThree: {
        ...defaultSiteContent.projectsPage.spotlightThree,
        ...(data?.projectsPage?.spotlightThree ?? {}),
      },
      spotlightFour: {
        ...defaultSiteContent.projectsPage.spotlightFour,
        ...(data?.projectsPage?.spotlightFour ?? {}),
      },
      additionalSpotlights: mergeList(
        data?.projectsPage?.additionalSpotlights,
        defaultSiteContent.projectsPage.additionalSpotlights || []
      ),
    },
    projectItems: mergeList(data?.projectItems, defaultSiteContent.projectItems || []),
    contact: {
      ...defaultSiteContent.contact,
      ...(data?.contact ?? {}),
      addressLines: mergeList(
        data?.contact?.addressLines,
        defaultSiteContent.contact.addressLines || []
      ),
    },
    gallery: {
      items: mergeList(data?.gallery?.items, defaultSiteContent.gallery.items || []),
    },
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!adminDb) return defaultSiteContent;
  const snapshot = await adminDb.collection(COLLECTION).doc(DOC_ID).get();
  if (!snapshot.exists) return defaultSiteContent;
  const data = snapshot.data() as Partial<SiteContent>;
  return mergeSiteContent(data);
}

export async function getProjectBySlug(slug: string) {
  const content = await getSiteContent();
  return content.projectItems.find((item) => item.slug === slug) || null;
}
