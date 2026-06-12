"use client";

import { usePathname } from "next/navigation";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import {
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const HERO_SELECTOR = "[data-smart-navbar-hero]";
const HIDE_THRESHOLD = 120;
const SHOW_THRESHOLD = 15;
const PROGRAMMATIC_SCROLL_SETTLE_MS = 180;
const PROGRAMMATIC_SCROLL_FALLBACK_MS = 1000;

type ScrollDirection = "up" | "down";

type UseSmartNavbarOptions = {
  isMobileMenuOpen?: boolean;
};

type UseSmartNavbarResult = {
  hidden: boolean;
  navRef: RefObject<HTMLElement | null>;
  onBlurCapture: (event: FocusEvent<HTMLElement>) => void;
  onClickCapture: (event: MouseEvent<HTMLElement>) => void;
  onFocusCapture: () => void;
  onPointerDownCapture: (event: PointerEvent<HTMLElement>) => void;
  shouldReduceMotion: boolean;
};

function getSamePageHash(href: string) {
  let url: URL;

  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }

  if (
    url.origin !== window.location.origin ||
    url.pathname !== window.location.pathname ||
    !url.hash
  ) {
    return null;
  }

  return url.hash;
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeToReducedMotionChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function useSmartNavbar({
  isMobileMenuOpen = false,
}: UseSmartNavbarOptions = {}): UseSmartNavbarResult {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const motionShouldReduceMotion = useReducedMotion();
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChange,
    getReducedMotionSnapshot,
    () => false,
  );
  const shouldReduceMotion = Boolean(motionShouldReduceMotion || prefersReducedMotion);
  const [hidden, setHidden] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const isPinnedVisible = shouldReduceMotion || isMobileMenuOpen || hasFocusWithin;
  const activationThresholdRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const isPointerFocusRef = useRef(false);
  const lastDirectionRef = useRef<ScrollDirection | null>(null);
  const accumulatedScrollDistanceRef = useRef(0);
  const programmaticScrollTimerRef = useRef<number | null>(null);

  const clearProgrammaticScrollTimer = useCallback(() => {
    if (programmaticScrollTimerRef.current === null) {
      return;
    }

    window.clearTimeout(programmaticScrollTimerRef.current);
    programmaticScrollTimerRef.current = null;
  }, []);

  const scheduleProgrammaticScrollEnd = useCallback(
    (delayMs = PROGRAMMATIC_SCROLL_SETTLE_MS) => {
      clearProgrammaticScrollTimer();

      programmaticScrollTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        programmaticScrollTimerRef.current = null;
      }, delayMs);
    },
    [clearProgrammaticScrollTimer],
  );

  const resetDirectionTracking = useCallback(() => {
    lastDirectionRef.current = null;
    accumulatedScrollDistanceRef.current = 0;
  }, []);

  const updateActivationThreshold = useCallback(() => {
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 0;
    const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);

    if (!hero) {
      activationThresholdRef.current = navHeight;
      return;
    }

    activationThresholdRef.current = Math.max(
      navHeight,
      hero.getBoundingClientRect().bottom + window.scrollY,
    );
  }, []);

  const beginProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    setHidden(false);
    resetDirectionTracking();
    scheduleProgrammaticScrollEnd(PROGRAMMATIC_SCROLL_FALLBACK_MS);
  }, [resetDirectionTracking, scheduleProgrammaticScrollEnd]);

  useEffect(() => {
    updateActivationThreshold();
    resetDirectionTracking();

    const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
    const resizeObserver = new ResizeObserver(updateActivationThreshold);
    const animationFrameId = window.requestAnimationFrame(() => {
      updateActivationThreshold();
      setHidden(false);
      resetDirectionTracking();
    });

    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    if (hero) {
      resizeObserver.observe(hero);
    }

    window.addEventListener("resize", updateActivationThreshold);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateActivationThreshold);
      resizeObserver.disconnect();
    };
  }, [pathname, resetDirectionTracking, updateActivationThreshold]);

  useEffect(() => {
    return clearProgrammaticScrollTimer;
  }, [clearProgrammaticScrollTimer]);

  useEffect(() => {
    const nav = navRef.current;

    if (!nav) {
      return;
    }

    let focusFrameId: number | null = null;

    const clearFocusFrame = () => {
      if (focusFrameId === null) {
        return;
      }

      window.cancelAnimationFrame(focusFrameId);
      focusFrameId = null;
    };

    const handleFocusIn = () => {
      clearFocusFrame();

      if (isPointerFocusRef.current) {
        return;
      }

      setHasFocusWithin(true);
      setHidden(false);
      resetDirectionTracking();
    };

    const handleFocusOut = () => {
      clearFocusFrame();

      focusFrameId = window.requestAnimationFrame(() => {
        setHasFocusWithin(nav.contains(document.activeElement));
        focusFrameId = null;
      });
    };

    nav.addEventListener("focusin", handleFocusIn);
    nav.addEventListener("focusout", handleFocusOut);

    return () => {
      clearFocusFrame();
      nav.removeEventListener("focusin", handleFocusIn);
      nav.removeEventListener("focusout", handleFocusOut);
    };
  }, [resetDirectionTracking]);

  useMotionValueEvent(scrollY, "change", (currentScrollY) => {
    const previousScrollY = scrollY.getPrevious();

    if (isPinnedVisible) {
      setHidden(false);
      resetDirectionTracking();
      return;
    }

    if (isProgrammaticScrollRef.current) {
      setHidden(false);
      resetDirectionTracking();
      scheduleProgrammaticScrollEnd();
      return;
    }

    if (currentScrollY <= 0 || currentScrollY <= activationThresholdRef.current) {
      setHidden(false);
      resetDirectionTracking();
      return;
    }

    if (previousScrollY === undefined) {
      return;
    }

    const delta = currentScrollY - previousScrollY;

    if (Math.abs(delta) < 1) {
      return;
    }

    const direction: ScrollDirection = delta > 0 ? "down" : "up";

    if (direction !== lastDirectionRef.current) {
      lastDirectionRef.current = direction;
      accumulatedScrollDistanceRef.current = Math.abs(delta);
    } else {
      accumulatedScrollDistanceRef.current += Math.abs(delta);
    }

    const threshold = direction === "down" ? HIDE_THRESHOLD : SHOW_THRESHOLD;

    if (accumulatedScrollDistanceRef.current < threshold) {
      return;
    }

    setHidden(direction === "down");
  });

  const handleFocusCapture = useCallback(() => {
    if (isPointerFocusRef.current) {
      return;
    }

    setHasFocusWithin(true);
    setHidden(false);
    resetDirectionTracking();
  }, [resetDirectionTracking]);

  const handleBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    const nav = event.currentTarget;

    window.requestAnimationFrame(() => {
      setHasFocusWithin(nav.contains(document.activeElement));
    });
  }, []);

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href");

      if (!link || !event.currentTarget.contains(link) || !href) {
        return;
      }

      if (getSamePageHash(href)) {
        beginProgrammaticScroll();
      }
    },
    [beginProgrammaticScroll],
  );

  const handlePointerDownCapture = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest<HTMLAnchorElement>("a[href]");

    if (!link || !event.currentTarget.contains(link)) {
      return;
    }

    isPointerFocusRef.current = true;
    setHasFocusWithin(false);

    window.setTimeout(() => {
      isPointerFocusRef.current = false;
    }, 0);
  }, []);

  return {
    hidden: isPinnedVisible ? false : hidden,
    navRef,
    onBlurCapture: handleBlurCapture,
    onClickCapture: handleClickCapture,
    onFocusCapture: handleFocusCapture,
    onPointerDownCapture: handlePointerDownCapture,
    shouldReduceMotion,
  };
}
