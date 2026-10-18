"use client";

import { useEffect } from "react";

const FOCAL_RATIO = 0.42;
const SECTION_ID = "what-i-bring";
const ROW_SELECTOR = ".what-i-bring__row";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** Continuous index of `focalY` among row centers, clamped to the first and last row. */
function indexAt(focalY: number, centers: readonly number[]): number {
  const last = centers.length - 1;

  if (last <= 0 || focalY <= centers[0]) {
    return 0;
  }

  if (focalY >= centers[last]) {
    return last;
  }

  for (let index = 0; index < last; index += 1) {
    const start = centers[index];
    const end = centers[index + 1];

    if (focalY > end) {
      continue;
    }

    const span = end - start;

    if (span <= 0) {
      return index;
    }

    return index + (focalY - start) / span;
  }

  return last;
}

/**
 * Focal line at 42% of the viewport, mapped through the row centers.
 * If the page ends before the last center can reach that line, the indexes
 * still short of it compress into the remaining scroll. Row height stays put.
 */
function activeIndex(focalY: number, centers: readonly number[], maxFocalY: number): number {
  const last = centers.length - 1;

  if (last <= 0) {
    return 0;
  }

  if (maxFocalY >= centers[last] - 1) {
    return indexAt(focalY, centers);
  }

  let anchor = 0;

  while (anchor < last && centers[anchor + 1] <= maxFocalY) {
    anchor += 1;
  }

  if (focalY <= centers[anchor] || maxFocalY <= centers[anchor]) {
    return indexAt(Math.min(focalY, centers[anchor]), centers);
  }

  const t = (focalY - centers[anchor]) / (maxFocalY - centers[anchor]);

  return anchor + clamp01(t) * (last - anchor);
}

export function WhatIBringEmphasis() {
  useEffect(() => {
    const section = document.getElementById(SECTION_ID);

    if (!section) {
      return;
    }

    const rows = [...section.querySelectorAll<HTMLElement>(ROW_SELECTOR)];

    if (rows.length === 0) {
      return;
    }

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const centers: number[] = [];
    const written: number[] = [];
    let frame = 0;
    let listening = false;
    let scrollHeight = 0;

    const clearEmphasis = () => {
      written.length = 0;

      for (const row of rows) {
        row.style.removeProperty("--emphasis");
      }
    };

    const measure = () => {
      const scrollY = window.scrollY;
      centers.length = 0;

      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        centers.push(rect.top + scrollY + rect.height / 2);
      }

      scrollHeight = document.documentElement.scrollHeight;
    };

    const update = () => {
      frame = 0;

      if (motion.matches || centers.length === 0) {
        return;
      }

      const viewportHeight = window.innerHeight;
      const focalY = window.scrollY + viewportHeight * FOCAL_RATIO;
      const maxFocalY = scrollHeight - viewportHeight * (1 - FOCAL_RATIO);
      const active = activeIndex(focalY, centers, maxFocalY);

      rows.forEach((row, index) => {
        const rounded = Math.round(smoothstep(1 - Math.abs(index - active)) * 1000) / 1000;

        if (written[index] === rounded) {
          return;
        }

        written[index] = rounded;
        row.style.setProperty("--emphasis", rounded.toFixed(3));
      });
    };

    const requestUpdate = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    const onScroll = () => {
      requestUpdate();
    };

    const setListening = (on: boolean) => {
      if (on === listening) {
        return;
      }

      listening = on;

      if (on) {
        window.addEventListener("scroll", onScroll, { passive: true });
        requestUpdate();
        return;
      }

      window.removeEventListener("scroll", onScroll);
    };

    const syncListening = () => {
      if (motion.matches) {
        setListening(false);
        return;
      }

      const rect = section.getBoundingClientRect();
      setListening(rect.bottom > 0 && rect.top < window.innerHeight);
    };

    const onResize = () => {
      measure();
      syncListening();
      requestUpdate();
    };

    const onMotionChange = () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      if (motion.matches) {
        setListening(false);
        clearEmphasis();
        return;
      }

      measure();
      update();
      syncListening();
    };

    const observer = new IntersectionObserver((entries) => {
      if (motion.matches) {
        setListening(false);
        return;
      }

      setListening(entries.some((entry) => entry.isIntersecting));
    });

    const layoutRoot = section.closest(".home-page") ?? section;
    const resizeObserver = new ResizeObserver(onResize);

    measure();

    if (motion.matches) {
      clearEmphasis();
    } else {
      update();
      syncListening();
    }

    observer.observe(section);
    resizeObserver.observe(layoutRoot);
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    motion.addEventListener("change", onMotionChange);

    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled || motion.matches) {
        return;
      }

      measure();
      requestUpdate();
    });

    return () => {
      cancelled = true;

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      setListening(false);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      motion.removeEventListener("change", onMotionChange);
      clearEmphasis();
    };
  }, []);

  return null;
}
