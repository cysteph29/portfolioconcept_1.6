"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { CaseStudySection } from "@/config/case-studies";

type Props = {
  sections: CaseStudySection[];
};

// Matches the sticky top offset: --nav-height (6.25rem = 100px) + --spacing-home-stack-gap (1.25rem = 20px)
const STICKY_OFFSET_PX = 120;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function CaseStudyToc({ sections }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null,
  );
  const intersectingRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (sections.length === 0) return;

    const ids = sections.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const intersecting = intersectingRef.current;

    function updateActive() {
      // When the reader has scrolled to the very bottom, activate the last section.
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;

      if (nearBottom) {
        setActiveId(ids[ids.length - 1]);
        return;
      }

      if (intersecting.size === 0) return;

      // Among currently intersecting sections, pick the one closest to the top
      // of the adjusted viewport (i.e. smallest bounding rect top value).
      const candidates = elements.filter((el) => intersecting.has(el.id));
      if (candidates.length === 0) return;

      candidates.sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
      );
      setActiveId(candidates[0].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });
        updateActive();
      },
      {
        // Top margin offsets the fixed nav + gap so a section is considered active
        // only once its top edge has cleared the nav.
        // Bottom margin clips the lower portion so the next section doesn't
        // compete before the reader has clearly entered it.
        rootMargin: `-${STICKY_OFFSET_PX}px 0px -35% 0px`,
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));

    // Scroll listener supplements the observer for the bottom-of-page case.
    window.addEventListener("scroll", updateActive, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActive);
    };
    // sections is the only outer dep; ids and elements are derived inside the effect
  }, [sections]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }

  if (sections.length === 0) return null;

  return (
    <nav aria-label="Contents" className="case-study-sidebar__toc">
      <ul className="case-study-sidebar__toc-list">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                aria-current={isActive ? "location" : undefined}
                className={[
                  "case-study-sidebar__toc-link text-label-1",
                  isActive
                    ? "case-study-sidebar__toc-link--active"
                    : "text-text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
