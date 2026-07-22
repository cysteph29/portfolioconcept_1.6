"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSmartNavbar } from "@/components/navigation/use-smart-navbar";

const NAV_ITEMS = [
  { href: "/#work", label: "Work", isActive: (pathname: string) => pathname.startsWith("/work") },
  { href: "/about", label: "About", isActive: (pathname: string) => pathname === "/about" },
  { href: "/#contact", label: "Contact", isActive: () => false },
  {
    href: "https://drive.google.com/file/d/1vgbehuPY2rzH--WvdVkO-vv0TGn02LXM/view?usp=sharing",
    label: "Resume",
    isActive: () => false,
    external: true,
  },
];

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const {
    hidden,
    navRef,
    onBlurCapture,
    onClickCapture,
    onFocusCapture,
    onPointerDownCapture,
    shouldReduceMotion,
  } = useSmartNavbar({ isMobileMenuOpen });

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
      <motion.header
        animate={{ opacity: hidden ? 0 : 1, y: hidden ? "-100%" : "0%" }}
        className="top-nav-surface fixed inset-x-0 top-0 z-50"
        initial={false}
        onBlurCapture={onBlurCapture}
        onClickCapture={onClickCapture}
        onFocusCapture={onFocusCapture}
        onPointerDownCapture={onPointerDownCapture}
        ref={navRef}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
      >
        <nav className="flex items-center justify-between px-[var(--spacing-home-edge-x)] pt-[var(--nav-padding-top)] pb-[var(--nav-padding-bottom)]">
          <Link
            aria-label="Home"
            className="inline-flex items-center"
            href="/"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="block h-10 w-10 object-cover"
              height={40}
              src="/assets/profilepic.png"
              width={40}
            />
          </Link>

          <div className="flex items-center gap-[var(--spacing-home-actions-gap)]">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-label-1 text-text-primary transition-opacity hover:opacity-100 ${
                    isActive ? "opacity-100" : "opacity-80"
                  }`}
                  href={item.href}
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
      </motion.header>
      <AnimatePresence initial={false}>
        {isMobileMenuOpen ? (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="mobile-nav-menu"
            exit={shouldReduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            id="mobile-navigation-menu"
            initial={shouldReduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            onClickCapture={onClickCapture}
            onPointerDownCapture={onPointerDownCapture}
            ref={menuRef}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
          >
            <div className="mobile-nav-menu__items">
              {NAV_ITEMS.map((item) => {
                const isActive = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`text-label-1 text-text-primary ${isActive ? "opacity-100" : "opacity-80"}`}
                    href={item.href}
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

