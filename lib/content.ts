import { adminDb } from "./firebase/admin";
import { defaultSiteContent } from "./content-defaults";
import type { SiteContent } from "./content-types";
import { mergeSiteContent } from "./content-merge";

const COLLECTION = "siteContent";
const DOC_ID = "main";

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
