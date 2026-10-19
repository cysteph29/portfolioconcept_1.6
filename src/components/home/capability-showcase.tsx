"use client";

import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FocusEvent, MouseEvent, PointerEvent as ReactPointerEvent } from "react";

import { CapabilityCanvas } from "@/components/home/capability-canvas";
import type { CapabilityFigureId } from "@/components/home/capability-figures";
import { CapabilityForms, FORM_STATE_COUNT } from "@/components/home/capability-forms";
import { WHAT_I_BRING_ART, type Capability } from "@/config/what-i-bring";

const CYCLE_MS = 5000;
const TOUCH_HOLD_MS = 10000;
const HOVER_INTENT_MS = 100;
const IN_VIEW_THRESHOLD = 0.35;
const AUTOPLAY_QUERY = "(min-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function useMediaQuery(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

function usePageVisible() {
  return useSyncExternalStore(
    (onStoreChange) => {
      document.addEventListener("visibilitychange", onStoreChange);
      return () => document.removeEventListener("visibilitychange", onStoreChange);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}

const CAPABILITY_FIGURES: Partial<Record<string, CapabilityFigureId>> = {
  "hard-problems": "interference",
  "ai-first": "completion",
  "design-and-code": "specimen",
  "customer-driven": "case",
  "end-to-end": "seam",
};

const ArtLayer = memo(function ArtLayer({ capability }: { capability: Capability }) {
  const figure = CAPABILITY_FIGURES[capability.id];

  return figure ? (
    <CapabilityCanvas figure={figure} />
  ) : (
    <span className="what-i-bring__art-label">{capability.illustrationConcept}</span>
  );
});

type CapabilityShowcaseProps = {
  capabilities: Capability[];
  heading: string;
  headingId: string;
};

export function CapabilityShowcase({ capabilities, heading, headingId }: CapabilityShowcaseProps) {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const nextDelayRef = useRef(CYCLE_MS);
  const pointerPressRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [keyboardInside, setKeyboardInside] = useState(false);

  const autoplayAvailable = useMediaQuery(AUTOPLAY_QUERY, true);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY, false);
  const pageVisible = usePageVisible();

  const playing = userPlaying ?? !prefersReducedMotion;
  const cycling =
    autoplayAvailable && playing && inView && pageVisible && !pointerInside && !keyboardInside;
  const count = capabilities.length;

  useEffect(() => {
    const showcase = showcaseRef.current;

    if (!showcase) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: IN_VIEW_THRESHOLD },
    );

    observer.observe(showcase);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cycling) {
      return;
    }

    const timer = window.setTimeout(() => {
      nextDelayRef.current = CYCLE_MS;
      setActiveIndex((index) => (index + 1) % count);
    }, nextDelayRef.current);

    return () => window.clearTimeout(timer);
  }, [activeIndex, count, cycling]);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearHoverTimer, [clearHoverTimer]);

  const onItemPointerEnter = (index: number) => (event: ReactPointerEvent) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null;
      setActiveIndex(index);
    }, HOVER_INTENT_MS);
  };

  const onListPointerEnter = (event: ReactPointerEvent) => {
    if (event.pointerType === "mouse") {
      setPointerInside(true);
    }
  };

  const onListPointerLeave = (event: ReactPointerEvent) => {
    if (event.pointerType === "mouse") {
      clearHoverTimer();
      setPointerInside(false);
    }
  };

  const onListPointerDown = () => {
    pointerPressRef.current = true;
  };

  const onListFocus = () => {
    if (!pointerPressRef.current) {
      setKeyboardInside(true);
    }

    pointerPressRef.current = false;
  };

  const onListBlur = (event: FocusEvent<HTMLOListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setKeyboardInside(false);
    }
  };

  const select = (index: number) => (event: MouseEvent) => {
    const { nativeEvent } = event;
    const touched = nativeEvent instanceof PointerEvent && nativeEvent.pointerType === "touch";

    clearHoverTimer();
    pointerPressRef.current = false;
    nextDelayRef.current = touched ? TOUCH_HOLD_MS : CYCLE_MS;
    setActiveIndex(index);
  };

  const togglePlaying = () => {
    nextDelayRef.current = CYCLE_MS;
    setUserPlaying(!playing);
  };

  return (
    <>
      <div className="what-i-bring__header">
        <h2 className="what-i-bring__heading text-heading-2 text-text-primary" id={headingId}>
          {heading}
        </h2>
        <button
          aria-label={playing ? "Pause capability rotation" : "Play capability rotation"}
          className="what-i-bring__playback"
          data-playing={playing || undefined}
          onClick={togglePlaying}
          type="button"
        >
          <span aria-hidden="true" className="what-i-bring__playback-icon" />
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <div className="what-i-bring__showcase" ref={showcaseRef}>
        <div aria-hidden="true" className="what-i-bring__art">
          {WHAT_I_BRING_ART === "forms" ? (
            <CapabilityForms state={activeIndex % FORM_STATE_COUNT} />
          ) : (
            capabilities.map((capability, index) => (
              <div
                className="what-i-bring__art-layer"
                data-active={index === activeIndex || undefined}
                key={capability.id}
              >
                <ArtLayer capability={capability} />
              </div>
            ))
          )}
        </div>
        <ol
          className="what-i-bring__list"
          onBlur={onListBlur}
          onFocus={onListFocus}
          onPointerDown={onListPointerDown}
          onPointerEnter={onListPointerEnter}
          onPointerLeave={onListPointerLeave}
        >
          {capabilities.map((capability, index) => {
            const active = index === activeIndex;

            return (
              <li
                className="what-i-bring__item"
                data-active={active || undefined}
                key={capability.id}
                onPointerEnter={onItemPointerEnter(index)}
                onPointerLeave={clearHoverTimer}
              >
                <h3 className="what-i-bring__headline text-text-primary">
                  <button
                    aria-pressed={active}
                    className="what-i-bring__trigger"
                    onClick={select(index)}
                    type="button"
                  >
                    <span aria-hidden="true" className="what-i-bring__marker" />
                    {capability.headline}
                  </button>
                </h3>
                <div className="what-i-bring__description-wrap">
                  <div className="what-i-bring__description-clip">
                    <p className="what-i-bring__description text-body-2 text-text-muted">
                      {capability.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
