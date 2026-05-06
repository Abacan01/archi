"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const resolvedBrand = brand ?? defaultBrand;
  const items = navItems?.length ? navItems : defaultNavItems;
  const hasLogin = items.some((item) => item.href === "/login");
  const navLinks = hasLogin ? items : [...items, { href: "/login", label: "Login" }];

  function scrollToTopOnActiveHome(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname === "/" && href === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <header className="site-header" id="top">
      <div className="container nav-wrap island">
        <Link
          className="brand"
          href="/"
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
              href={item.href}
              onClick={(event) => scrollToTopOnActiveHome(event, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
            href={item.href}
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
