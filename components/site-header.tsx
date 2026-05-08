"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import type { Brand, NavItem } from "../lib/content-types";

type SiteHeaderProps = {
  brand?: Brand;
  navItems?: NavItem[];
};

const defaultBrand: Brand = {
  mark: "JC",
  text: "JCCHUA & Associates",
};

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery View" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ brand, navItems }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const resolvedBrand = brand ?? defaultBrand;
  const items = navItems?.length ? navItems : defaultNavItems;
  const hasLogin = items.some((item) => item.href === "/login");
  let navLinks = hasLogin ? items : [...items, { href: "/login", label: "Login" }];

  useEffect(() => {
    const updateEditMode = () => {
      setIsEditMode(window.location.search.includes("editMode=true"));
    };

    updateEditMode();
    window.addEventListener("popstate", updateEditMode);
    return () => window.removeEventListener("popstate", updateEditMode);
  }, []);

  if (isEditMode) {
    navLinks = navLinks.filter((item) => item.href !== "/login");
  }

  function scrollToTopOnActiveHome(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname === "/" && href === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const getNavigationHref = (href: string) => {
    if (isEditMode) {
      return `${href}${href.includes("?") ? "&" : "?"}editMode=true`;
    }
    return href;
  };

  return (
    <header className="site-header" id="top">
      <div className="container nav-wrap island">
        <Link
          className="brand"
          href={getNavigationHref("/")}
          aria-label={`${resolvedBrand.text} home`}
          onClick={(event) => scrollToTopOnActiveHome(event, "/")}
        >
          <span className="brand-mark">{resolvedBrand.mark}</span>
          <span className="brand-text">{resolvedBrand.text}</span>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href ? "active" : ""}
              href={getNavigationHref(item.href)}
              onClick={(event) => scrollToTopOnActiveHome(event, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {isEditMode && (
            <>
              <span style={{ 
                backgroundColor: "#ff6b6b", 
                color: "white", 
                padding: "0.25rem 0.75rem", 
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: "bold"
              }}>
                EDIT MODE
              </span>
              <Link href="/admin" className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                Back to Admin
              </Link>
            </>
          )}
        </div>

        <button
          id="menuToggle"
          className="menu-toggle"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobileMenu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          type="button"
        >
          Menu
        </button>
      </div>

      <nav
        id="mobileMenu"
        className={isMobileMenuOpen ? "mobile-nav open" : "mobile-nav"}
        aria-label="Mobile navigation"
      >
        {navLinks.map((item) => (
          <Link
            key={item.href}
            className={pathname === item.href ? "active" : ""}
            href={getNavigationHref(item.href)}
            onClick={(event) => {
              scrollToTopOnActiveHome(event, item.href);
              setIsMobileMenuOpen(false);
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
