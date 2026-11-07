"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { scrollToElement } from "@/components/navigation/smooth-scroll";
import type { CaseStudySection } from "@/config/case-studies";

type Props = {
  sections: CaseStudySection[];
};

// Matches the sticky top offset: --nav-height (3.75rem = 60px) + --spacing-home-stack-gap (1.25rem = 20px)
const STICKY_OFFSET_PX = 80;
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

function hasNestedContents(sections: CaseStudySection[]) {
  return sections.some((section) => (section.navChildren?.length ?? 0) > 0);
}

export function CaseStudyToc({ sections }: Props) {
  if (hasNestedContents(sections)) {
    return <CaseStudyNestedToc sections={sections} />;
  }

  return <CaseStudyFlatToc sections={sections} />;
}

function CaseStudyFlatToc({ sections }: Props) {
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
    scrollToElement(target, {
      block: "start",
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
                  "case-study-sidebar__toc-link text-heading-5",
                  isActive
                    ? "case-study-sidebar__toc-link--active"
                    : "text-text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
              >
                {section.navLabel ?? section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const NESTED_HYSTERESIS_PX = 16;

function CaseStudyNestedToc({ sections }: Props) {
  const ordered = useMemo(() => {
    const items: { id: string; parentId: string | null }[] = [];
    for (const section of sections) {
      items.push({ id: section.id, parentId: null });
      for (const child of section.navChildren ?? []) {
        items.push({ id: child.id, parentId: section.id });
      }
    }
    return items;
  }, [sections]);
  const [activeId, setActiveId] = useState<string | null>(ordered[0]?.id ?? null);
  const activeIdRef = useRef(activeId);
  const navRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (ordered.length === 0) return;

    const line = STICKY_OFFSET_PX + 1;
    const parentOf = new Map(ordered.map((item) => [item.id, item.parentId]));

    const idAt = (threshold: number) => {
      let current = ordered[0].id;
      for (const item of ordered) {
        const element = document.getElementById(item.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= threshold) current = item.id;
      }
      return current;
    };

    const updateActive = () => {
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const next = nearBottom ? ordered[ordered.length - 1].id : idAt(line);
      const previous = activeIdRef.current;

      if (
        previous &&
        previous !== next &&
        parentOf.get(previous) === next &&
        idAt(line + NESTED_HYSTERESIS_PX) === previous
      ) {
        return;
      }

      if (previous === next) return;
      activeIdRef.current = next;
      setActiveId(next);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [ordered]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const link = nav.querySelector<HTMLElement>('[aria-current="location"]');
    if (!link) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.top < navRect.top) {
      nav.scrollTop -= navRect.top - linkRect.top;
    } else if (linkRect.bottom > navRect.bottom) {
      nav.scrollTop += linkRect.bottom - navRect.bottom;
    }
  }, [activeId]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    activeIdRef.current = id;
    setActiveId(id);
    scrollToElement(target, {
      block: "start",
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }

  if (sections.length === 0) return null;

  return (
    <nav aria-label="Contents" className="case-study-sidebar__toc case-study-sidebar__toc--nested" ref={navRef}>
      <ul className="case-study-sidebar__toc-list">
        {sections.map((section) => {
          const children = section.navChildren ?? [];
          const childActive = children.some((child) => child.id === activeId);
          const parentActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                aria-current={parentActive ? "location" : undefined}
                className={[
                  "case-study-sidebar__toc-link text-heading-5",
                  parentActive ? "case-study-sidebar__toc-link--active" : "",
                  childActive ? "case-study-sidebar__toc-link--group" : "",
                  parentActive || childActive ? "" : "text-text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={`#${section.id}`}
                onClick={(event) => handleClick(event, section.id)}
              >
                {section.navLabel ?? section.label}
              </a>
              {children.length > 0 ? (
                <ul className="case-study-sidebar__toc-sublist">
                  {children.map((child) => {
                    const isActive = activeId === child.id;
                    return (
                      <li key={child.id}>
                        <a
                          aria-current={isActive ? "location" : undefined}
                          className={[
                            "case-study-sidebar__toc-link text-heading-5",
                            isActive
                              ? "case-study-sidebar__toc-link--active"
                              : "text-text-muted",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          href={`#${child.id}`}
                          onClick={(event) => handleClick(event, child.id)}
                        >
                          {child.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
