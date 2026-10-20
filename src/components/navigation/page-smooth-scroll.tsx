"use client";

import { useEffect, useSyncExternalStore } from "react";

import { configurePageScroll, releasePageScroll } from "@/components/navigation/smooth-scroll";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(REDUCED_MOTION_QUERY);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function PageSmoothScroll() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    configurePageScroll(prefersReducedMotion);

    return () => {
      releasePageScroll();
    };
  }, [prefersReducedMotion]);

  return null;
}
