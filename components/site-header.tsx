"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { useEditSession } from "./edit-session-provider";
import type { Brand, NavItem } from "../lib/content-types";
import { auth, db } from "../lib/firebase/client";

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
  const { isEditMode, isAdmin } = useEditSession();
  const isAdminUser = Boolean(isAdmin);
  const [hasEditParam, setHasEditParam] = useState(false);
  const [showEditRedirectBanner, setShowEditRedirectBanner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loginLabel = "Admin Log In";
  const resolvedBrand = brand ?? defaultBrand;
  const items = navItems?.length ? navItems : defaultNavItems;
  const hasLogin = items.some((item) => item.href === "/login");
  let allNavLinks = hasLogin ? items : [...items, { href: "/login", label: loginLabel }];
  
  // Separate login from regular nav links
  const regularNavLinks = allNavLinks.filter((item) => item.href !== "/login");
  const loginItem = allNavLinks.find((item) => item.href === "/login");

  // `isAdminUser` derived directly from context to avoid stale mirrors

  useEffect(() => {
    if (typeof window === "undefined") return;
    const present = window.location.search.includes("editMode=true");
    setHasEditParam(present);
  }, []);

  useEffect(() => {
    let t: number | undefined;
    if (hasEditParam && !isAdminUser) {
      setShowEditRedirectBanner(true);
      // auto-redirect after short delay to the same URL without editMode param
      t = window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("editMode");
        window.location.replace(url.toString());
      }, 3000);
    } else {
      setShowEditRedirectBanner(false);
    }

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [hasEditParam, isAdminUser]);

  function scrollToTopOnActiveHome(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname === "/" && href === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const normalizePath = (p?: string | null) => {
    if (!p) return "";
    try {
      // remove trailing slashes except for root
      return p.replace(/\/+$|^\s+|\s+$/g, "") || "/";
    } catch {
      return p;
    }
  };

  const isActive = (href: string) => {
    const pn = normalizePath(pathname ?? "/");
    const hn = normalizePath(href);
    if (hn === "/") return pn === "/";
    return pn === hn || pn.startsWith(hn + "/");
  };

  const getNavigationHref = (href: string) => {
    if (isEditMode) {
      return `${href}${href.includes("?") ? "&" : "?"}editMode=true`;
    }
    return href;
  };

  return (
    <>
      {showEditRedirectBanner ? (
        <div style={{ background: "#fff4e5", color: "#663c00", padding: "0.5rem 1rem", textAlign: "center", fontWeight: 600 }}>
          You are viewing an edit-mode URL — please sign in as an admin to edit. Redirecting to the public site in 3 seconds. <a href="#" onClick={(e) => {
            e.preventDefault();
            const url = new URL(window.location.href);
            url.searchParams.delete("editMode");
            window.location.replace(url.toString());
          }} style={{ marginLeft: "0.5rem", textDecoration: "underline" }}>Continue now</a>
        </div>
      ) : null}

      <header className="site-header" id="top" suppressHydrationWarning>
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
          {regularNavLinks.map((item) => (
            <Link
              key={item.href}
              className={isActive(item.href) ? "active" : ""}
              href={getNavigationHref(item.href)}
              onClick={(event) => scrollToTopOnActiveHome(event, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {!isEditMode && !isAdminUser && loginItem ? (
            <Link href={getNavigationHref(loginItem.href)} className="btn btn-outline">
              {loginLabel}
            </Link>
          ) : null}
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
                Back to Dashboard
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
        {regularNavLinks.map((item) => (
          <Link
            key={item.href}
            className={isActive(item.href) ? "active" : ""}
            href={getNavigationHref(item.href)}
            onClick={(event) => {
              scrollToTopOnActiveHome(event, item.href);
              setIsMobileMenuOpen(false);
            }}
          >
            {item.label}
          </Link>
        ))}
        {!isEditMode && loginItem && (
          <Link
            href={getNavigationHref(loginItem.href)}
            className="btn btn-outline"
            style={{ marginTop: "0.5rem", width: "100%" }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {loginLabel}
          </Link>
        )}
        {!isEditMode && !isAdminUser && loginItem && (
          <Link
            href={getNavigationHref(loginItem.href)}
            className="btn btn-outline"
            style={{ marginTop: "0.5rem", width: "100%" }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {loginLabel}
          </Link>
        )}
      </nav>
    </header>
    </>
  );
}
