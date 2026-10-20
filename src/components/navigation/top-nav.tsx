"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { isDiveReviewPath, toReviewHref } from "@/lib/review-path";

const NAV_ITEMS = [
  { href: "/#work", label: "Work", isActive: () => false },
  { href: "/about", label: "About", isActive: (pathname: string) => pathname === "/about" },
  { href: "/#contact", label: "Contact", isActive: () => false },
  {
    href: "https://drive.google.com/file/d/1FpM6T3gdd5pTjueUj4N9ho0zTApPaJpL/view?usp=sharing",
    label: "Resume",
    isActive: () => false,
    external: true,
  },
];

export function TopNav() {
  const pathname = usePathname();
  const review = isDiveReviewPath(pathname);
  const publicPathname = review ? pathname.slice("/dive".length) || "/" : pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) {
        closeMobileMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  return (
    <>
      <header className="top-nav-surface">
        <nav className="flex items-center justify-between pt-[var(--nav-padding-top)] pb-[var(--nav-padding-bottom)]">
          <Link
            aria-current={publicPathname === "/" ? "page" : undefined}
            className={`text-heading-5 text-text-primary transition-opacity hover:opacity-100 ${
              publicPathname === "/" ? "top-nav-link--active opacity-100" : "opacity-80"
            }`}
            href={review ? "/dive" : "/"}
          >
            Home
          </Link>

          <div className="flex items-center gap-[var(--spacing-home-actions-gap)]">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isActive(publicPathname);

              return (
                <Link
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-heading-5 text-text-primary transition-opacity hover:opacity-100 ${
                    isActive ? "top-nav-link--active opacity-100" : "opacity-80"
                  }`}
                  href={toReviewHref(item.href, review)}
                  {...("external" in item && item.external
                    ? { rel: "noopener noreferrer", target: "_blank" }
                    : {})}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            aria-controls="mobile-navigation-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className={`mobile-nav-toggle__icon ${isMobileMenuOpen ? "is-open" : ""}`}>
              <span />
              <span />
            </span>
          </button>
        </nav>
      </header>
      <AnimatePresence initial={false}>
        {isMobileMenuOpen ? (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="mobile-nav-menu"
            exit={shouldReduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            id="mobile-navigation-menu"
            initial={shouldReduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            ref={menuRef}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
          >
            <div className="mobile-nav-menu__items">
              {NAV_ITEMS.map((item) => {
                const isActive = item.isActive(publicPathname);
                return (
                  <Link
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`text-heading-5 text-text-primary ${
                      isActive ? "top-nav-link--active opacity-100" : "opacity-80"
                    }`}
                    href={toReviewHref(item.href, review)}
                    onClick={closeMobileMenu}
                    {...("external" in item && item.external
                      ? { rel: "noopener noreferrer", target: "_blank" }
                      : {})}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

