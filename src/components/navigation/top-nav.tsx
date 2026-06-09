"use client";

import { usePathname } from "next/navigation";

import { TransitionLink } from "@/components/navigation/transition-link";
import { useTransitionContext } from "@/components/navigation/transition-context";
import { TOP_LEVEL_SECTIONS, getHorizontalDirection, getSectionFromPathname } from "@/config/sections";

const RESUME_URL = "https://example.com/resume";

export function TopNav() {
  const pathname = usePathname();
  const activeSection = getSectionFromPathname(pathname);
  const { isTransitioning } = useTransitionContext();
  const homeSection = TOP_LEVEL_SECTIONS[0];
  const navSections = TOP_LEVEL_SECTIONS.filter((section) => section.id !== "home");

  return (
    <header className="top-nav-surface fixed inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between px-[var(--spacing-home-edge-x)] pt-[var(--nav-padding-top)] pb-[var(--nav-padding-bottom)]">
        <TransitionLink
          axis="x"
          aria-label="Home"
          className={`inline-flex items-center ${
            isTransitioning ? "cursor-not-allowed opacity-70" : ""
          }`}
          direction={getHorizontalDirection(pathname, homeSection.href)}
          href={homeSection.href}
        >
          <img
            alt=""
            aria-hidden="true"
            className="block h-10 w-10 object-cover"
            src="/assets/profilepic.png"
          />
        </TransitionLink>

        <div className="flex items-center gap-[var(--spacing-home-actions-gap)]">
          {navSections.map((section) => {
            const isActive = activeSection.id === section.id;
            const direction = getHorizontalDirection(pathname, section.href);

            return (
              <TransitionLink
                key={section.id}
                axis="x"
                aria-current={isActive ? "page" : undefined}
                className={`font-pixel text-button font-normal text-text-primary transition-opacity hover:opacity-100 ${
                  isActive ? "opacity-100" : "opacity-80"
                } ${isTransitioning ? "cursor-not-allowed opacity-70" : ""}`}
                direction={direction}
                href={section.href}
              >
                {section.label}
              </TransitionLink>
            );
          })}
          <a
            className={`font-pixel text-button font-normal text-text-primary transition-opacity hover:opacity-100 ${
              isTransitioning ? "cursor-not-allowed opacity-70" : "opacity-80"
            }`}
            href={RESUME_URL}
            onClick={(event) => {
              if (isTransitioning) {
                event.preventDefault();
              }
            }}
            rel="noopener"
            target="_blank"
          >
            Resume
          </a>
        </div>
      </nav>
    </header>
  );
}

