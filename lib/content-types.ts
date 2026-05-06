export type NavItem = { href: string; label: string };
export type Brand = { mark: string; text: string };

export type SocialIcon = "facebook" | "linkedin" | "custom";
export type SocialLink = { label: string; href: string; icon: SocialIcon; iconUrl?: string };

export type Badge = { label: string; href: string; imageUrl?: string; imageAlt?: string };

export type FooterContent = {
  text: string;
  socialLinks: SocialLink[];
  badges: Badge[];
};

export type GlobalContent = {
  brand: Brand;
  navItems: NavItem[];
  footer: FooterContent;
};

export type HomeAction = { label?: string; href?: string; variant?: string };

export type HomeContent = {
  eyebrow?: string;
  title?: string;
  paragraphs?: string[];
  actions?: HomeAction[];
  featuredDesign?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
  };
  tiles?: Array<{
    tag?: string;
    title?: string;
    description?: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
  }>;
  portfolioTitle?: string;
  portfolioNote?: string;
};

export type AboutContent = {
  pageTitle?: string;
  sidebarImageUrl?: string | null;
  sidebarImageAlt?: string | null;
  sidebarName?: string;
  sidebarSubtitle?: string;
  licenseNumbers?: string[];
  specializations?: string[];
  profileHeading?: string;
  profileParagraphs?: string[];
  profilePills?: string[];
  keyLicenses?: Array<{ title?: string; meta?: string }>;
  memberships?: Array<{ title?: string; meta?: string }>;
  award?: {
    imageUrl?: string | null;
    imageAlt?: string | null;
    text?: string;
  };
  architectureTitle?: string;
  principles?: string[];
  servicesTitle?: string;
  services?: Array<{ title?: string; paragraphs?: string[] }>;
};

export type SpotlightPanel = {
  title?: string;
  type?: string;
  description?: string;
  moreDetailsUrl?: string;
  points?: string[];
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export type ProjectsPageContent = {
  portfolioTitle?: string;
  filterLabels?: string[];
  spotlight?: SpotlightPanel;
  spotlightTwo?: SpotlightPanel;
  spotlightThree?: SpotlightPanel;
  spotlightFour?: SpotlightPanel;
  additionalSpotlights?: SpotlightPanel[];
};

export type ProjectItem = {
  id?: string;
  title?: string;
  category?: string;
  status?: string | null;
  year?: number | null;
  slug?: string;
  location?: string | null;
  descriptionText?: string | null;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  gallery?: Array<{ imageUrl?: string | null; imageAlt?: string | null }>;
};

export type ContactContent = {
  title?: string;
  formTitle?: string;
  formIntro?: string;
  officeHeading?: string;
  officeMapUrl?: string;
  officeMapLinkUrl?: string;
  officeMapLink?: string;
  contactHeading?: string;
  contactName?: string;
  contactRoles?: string;
  addressLines?: string[];
  phone?: string;
  email?: string;
};

export type GalleryItem = {
  src: string;
  alt: string;
  title: string;
  meta: string;
};

export type SiteContent = {
  global: GlobalContent;
  home: HomeContent;
  about: AboutContent;
  projectsPage: ProjectsPageContent;
  projectItems: ProjectItem[];
  contact: ContactContent;
  gallery: { items: GalleryItem[] };
};
