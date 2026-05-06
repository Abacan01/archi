import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { Badge, FooterContent, SocialLink } from "../lib/content-types";

import batangasEstatesLogo from "../assets/images/batangasestates4.jpg";
import vicmarHomesLogo from "../assets/images/vicmarhomeslogo.png";

type FooterProps = {
  footer?: FooterContent;
};

type BadgeWithFallback = Badge & { fallbackImage?: StaticImageData };

const defaultFooter: FooterContent = {
  text: "(c) 2026 JCCHUA & Associates. All rights reserved.",
  socialLinks: [
    { label: "Facebook", href: "https://www.facebook.com/realter.joseph/", icon: "facebook" },
    { label: "LinkedIn", href: "https://linkedin.com/in/digiscribe", icon: "linkedin" },
  ],
  badges: [],
};

const defaultBadges: BadgeWithFallback[] = [
  {
    label: "Batangas Estates",
    href: "http://www.batangasestates.com/",
    imageAlt: "Batangas Estates",
    fallbackImage: batangasEstatesLogo,
  },
  {
    label: "Vicmar Homes",
    href: "http://www.vicmarhomes.com/",
    imageAlt: "Vicmar Homes",
    fallbackImage: vicmarHomesLogo,
  },
];

function renderSocialIcon(link: SocialLink) {
  if (link.icon === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.2-1.5 1.6-1.5h1.7V4.5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H7.3V14h2.7v8h3.5z" />
      </svg>
    );
  }

  if (link.icon === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 2h-17C2.1 2 1 3.1 1 4.5v15C1 20.9 2.1 22 3.5 22h17c1.4 0 2.5-1.1 2.5-2.5v-15C23 3.1 21.9 2 20.5 2zM8 19H5v-9h3v9zm-1.5-10.3c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zM19 19h-3v-4.4c0-1.1-.4-1.8-1.3-1.8-.7 0-1.1.5-1.3.9-.1.2-.1.4-.1.7V19h-3v-9h3v1.2c.4-.6 1.1-1.5 2.7-1.5 2 0 3.5 1.3 3.5 4V19z" />
      </svg>
    );
  }

  if (link.icon === "custom" && link.iconUrl) {
    return <Image src={link.iconUrl} alt="" width={24} height={24} />;
  }

  return null;
}

export function SiteFooter({ footer }: FooterProps) {
  const content = footer ?? defaultFooter;
  const socialLinks = content.socialLinks?.length ? content.socialLinks : defaultFooter.socialLinks;
  const badges = content.badges ?? defaultBadges;

  return (
    <footer className="site-footer">
      <div className="container footer-wrap">
        <p>{content.text}</p>
        <div className="footer-actions">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              className="social-link"
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              title={link.label}
            >
              {renderSocialIcon(link)}
            </a>
          ))}
          <span className="footer-divider" aria-hidden="true">|</span>
          {badges.map((badge) => {
            const badgeWithFallback = badge as BadgeWithFallback;
            const src = badge.imageUrl || badgeWithFallback.fallbackImage;
            if (!src) return null;
            return (
              <a
                className="footer-badge"
                key={`${badge.label}-${badge.href}`}
                href={badge.href}
                target="_blank"
                rel="noreferrer"
                title={badge.label}
              >
                <Image
                  className="footer-badge-logo"
                  src={src}
                  alt={badge.imageAlt || badge.label}
                  width={24}
                  height={24}
                />
                <span className="footer-badge-label">{badge.label}</span>
              </a>
            );
          })}
        </div>
        <Link className="back-to-top" href="#top">Back to top</Link>
      </div>
    </footer>
  );
}
