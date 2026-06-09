"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTransitionTuning } from "@/components/navigation/transition-tuning-context";
import { getSectionIndexFromPathname } from "@/config/sections";
import { HORIZONTAL_TRAVEL_SECTION_MULTIPLIER } from "@/config/transitions";

export type TransitionAxis = "x" | "y";

type StartTransitionOptions = {
  href: string;
  axis: TransitionAxis;
  direction: 1 | -1;
  scroll?: boolean;
};

export type ActiveTransition = {
  from: string;
  to: string;
  axis: TransitionAxis;
  direction: 1 | -1;
  sectionsCrossed: number;
  durationMs: number;
  miniatureScale: number;
  shrinkPhaseEnd: number;
  travelPhaseEnd: number;
  easing: [number, number, number, number];
};

type TransitionContextValue = {
  activeTransition: ActiveTransition | null;
  isTransitioning: boolean;
  startTransition: (options: StartTransitionOptions) => boolean;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { snapshot } = useTransitionTuning();
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const commitTimeoutId = useRef<number | null>(null);
  const paintFrameOneId = useRef<number | null>(null);
  const paintFrameTwoId = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  const activeTransitionRef = useRef<ActiveTransition | null>(null);
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    activeTransitionRef.current = activeTransition;
  }, [activeTransition]);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const clearTransitionTimers = useCallback(() => {
    if (commitTimeoutId.current !== null) {
      window.clearTimeout(commitTimeoutId.current);
      commitTimeoutId.current = null;
    }
  }, []);

  const clearPaintFrames = useCallback(() => {
    if (paintFrameOneId.current !== null) {
      window.cancelAnimationFrame(paintFrameOneId.current);
      paintFrameOneId.current = null;
    }

    if (paintFrameTwoId.current !== null) {
      window.cancelAnimationFrame(paintFrameTwoId.current);
      paintFrameTwoId.current = null;
    }
  }, []);

  const clearTransition = useCallback(() => {
    clearPaintFrames();
    activeTransitionRef.current = null;
    setActiveTransition(null);
    setIsTransitioning(false);
    clearTransitionTimers();
  }, [clearPaintFrames, clearTransitionTimers]);

  useEffect(() => {
    return () => {
      clearPaintFrames();
      clearTransitionTimers();
    };
  }, [clearPaintFrames, clearTransitionTimers]);

  useEffect(() => {
    if (
      !activeTransitionRef.current ||
      !isTransitioning ||
      pathname !== activeTransitionRef.current.to
    ) {
      return;
    }

    clearPaintFrames();
    paintFrameOneId.current = window.requestAnimationFrame(() => {
      paintFrameTwoId.current = window.requestAnimationFrame(() => {
        clearTransition();
      });
    });

    return () => {
      clearPaintFrames();
    };
  }, [clearPaintFrames, clearTransition, isTransitioning, pathname]);

  const startTransition = useCallback(
    ({ href, axis, direction, scroll = true }: StartTransitionOptions) => {
      const currentPathname = pathnameRef.current;
      if (isTransitioning || href === currentPathname) {
        return false;
      }

      clearTransitionTimers();
      clearPaintFrames();
      const transitionSnapshot = snapshotRef.current;
      const baseShrinkDurationMs = transitionSnapshot.durationMs * transitionSnapshot.shrinkPhaseEnd;
      const baseTravelDurationMs =
        transitionSnapshot.durationMs *
        (transitionSnapshot.travelPhaseEnd - transitionSnapshot.shrinkPhaseEnd);
      const baseExpandDurationMs = transitionSnapshot.durationMs - baseShrinkDurationMs - baseTravelDurationMs;
      const sectionsCrossed = Math.abs(
        getSectionIndexFromPathname(currentPathname) - getSectionIndexFromPathname(href),
      );
      const travelSegments = axis === "x" ? Math.max(1, sectionsCrossed) : 1;
      const scaledTravelDurationMs =
        axis === "x"
          ? baseTravelDurationMs * travelSegments * HORIZONTAL_TRAVEL_SECTION_MULTIPLIER
          : baseTravelDurationMs;
      const totalDurationMs =
        baseShrinkDurationMs + scaledTravelDurationMs + baseExpandDurationMs;
      const shrinkPhaseEnd = baseShrinkDurationMs / totalDurationMs;
      const travelPhaseEnd = (baseShrinkDurationMs + scaledTravelDurationMs) / totalDurationMs;
      const nextTransition: ActiveTransition = {
        from: currentPathname,
        to: href,
        axis,
        direction,
        sectionsCrossed,
        durationMs: Math.round(totalDurationMs),
        miniatureScale: transitionSnapshot.miniatureScale,
        shrinkPhaseEnd,
        travelPhaseEnd,
        easing: [...transitionSnapshot.easing] as [number, number, number, number],
      };

      activeTransitionRef.current = nextTransition;
      setActiveTransition(nextTransition);
      setIsTransitioning(true);
      router.prefetch(href);

      commitTimeoutId.current = window.setTimeout(() => {
        router.push(href, { scroll });
      }, nextTransition.durationMs);

      return true;
    },
    [clearPaintFrames, clearTransitionTimers, isTransitioning, router],
  );

  const value = useMemo<TransitionContextValue>(
    () => ({
      activeTransition,
      isTransitioning,
      startTransition,
    }),
    [activeTransition, isTransitioning, startTransition],
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function useTransitionContext() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransitionContext must be used within TransitionProvider.");
  }

  return context;
}
