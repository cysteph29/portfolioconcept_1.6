"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";

/**
 * Viewport pixel transition. Durations are the full wave, including stagger.
 * `cellFadeMs` is taken from that total; it is not added on top.
 */
export const PAGE_PIXEL_TRANSITION = {
  coverMs: 400,
  revealMs: 300,
  /** Fully covered time. Navigation during this window counts toward it. */
  holdMs: 150,
  cellFadeMs: 40,
  columns: 40,
  mobileColumns: 15,
  mobileMaxWidth: 767,
  /** Cell-steps of timing noise along the sweep. 0 is a hard line. */
  spread: 5,
  /** Safety valve if a navigation never commits. Not an intentional hold. */
  navigationTimeoutMs: 8000,
} as const;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type PagePixelTransitionAction =
  | { type: "push"; href: string }
  | { type: "back" };

type StartResult = "started" | "ignored" | "bypass";

type PendingTransition = {
  id: number;
  action: PagePixelTransitionAction;
  pathname: string | null;
  fromPathname: string;
  fromHash: string;
};

type Playback = {
  id: number;
  cancelled: boolean;
  cells: HTMLSpanElement[];
  revealDelays: number[];
  cover: gsap.core.Timeline | null;
  reveal: gsap.core.Timeline | null;
  timeout: number;
  holdTimeout: number;
  coveredAt: number;
};

let requestImpl: ((action: PagePixelTransitionAction) => StartResult) | null = null;
let notifyScrollSettledImpl: (() => void) | null = null;

export function requestPagePixelTransition(action: PagePixelTransitionAction): StartResult {
  if (!requestImpl) {
    return "bypass";
  }

  return requestImpl(action);
}

/** Call after the destination scroll position has been applied. */
export function notifyPagePixelScrollSettled() {
  notifyScrollSettledImpl?.();
}

export function readInternalPageTransitionHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) {
    return null;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return null;
  }

  const link = target.closest("a");
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }

  if (link.target && link.target !== "_self") {
    return null;
  }

  if (link.hasAttribute("download") || !link.href) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function hash(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function playPixelWave(
  cells: HTMLSpanElement[],
  delays: number[],
  opacity: number,
  totalMs: number,
) {
  const totalSeconds = totalMs / 1000;
  const fadeSeconds = Math.min(PAGE_PIXEL_TRANSITION.cellFadeMs, totalMs) / 1000;
  const staggerWindow = Math.max(totalSeconds - fadeSeconds, 0);

  return gsap.timeline().to(
    cells,
    {
      opacity,
      duration: fadeSeconds,
      ease: "none",
      stagger: (index: number) => (delays[index] ?? 0) * staggerWindow,
    },
    0,
  );
}

function createPixelGrid(host: HTMLElement) {
  const width = host.clientWidth || window.innerWidth;
  const height = host.clientHeight || window.innerHeight;
  const isMobile = window.matchMedia(
    `(max-width: ${PAGE_PIXEL_TRANSITION.mobileMaxWidth}px)`,
  ).matches;
  const columns = Math.max(
    1,
    isMobile ? PAGE_PIXEL_TRANSITION.mobileColumns : PAGE_PIXEL_TRANSITION.columns,
  );
  const cellSize = width / columns;
  const rows = Math.max(Math.ceil(height / cellSize), 1);
  const spread = PAGE_PIXEL_TRANSITION.spread;
  const maxDelay = Math.max(rows - 1 + spread, 1);

  host.replaceChildren();
  host.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  host.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

  const cells: HTMLSpanElement[] = [];
  const coverDelays: number[] = [];
  const revealDelays: number[] = [];

  for (let index = 0; index < columns * rows; index += 1) {
    const cell = document.createElement("span");
    cell.className = "page-pixel-transition__cell";
    host.append(cell);
    cells.push(cell);

    const row = Math.floor(index / columns);
    const noise = hash(index) * spread;
    const upward = rows - 1 - row + noise;
    const delay = upward / maxDelay;
    coverDelays.push(delay);
    revealDelays.push(delay);
  }

  gsap.set(cells, { opacity: 0 });

  return { cells, coverDelays, revealDelays };
}

export function usePagePixelTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const [runId, setRunId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  const phaseRef = useRef<"idle" | "covering" | "holding" | "revealing">("idle");
  const pendingRef = useRef<PendingTransition | null>(null);
  const playbackRef = useRef<Playback | null>(null);
  const armedHistoryRef = useRef(false);
  const idRef = useRef(0);

  pathnameRef.current = pathname;
  routerRef.current = router;

  const finishRef = useRef<(id: number) => void>(() => {});
  const beginRevealRef = useRef<(id: number) => void>(() => {});

  finishRef.current = (id: number) => {
    if (pendingRef.current && pendingRef.current.id !== id) {
      return;
    }

    if (playbackRef.current && playbackRef.current.id !== id) {
      return;
    }

    if (playbackRef.current?.id === id) {
      window.clearTimeout(playbackRef.current.timeout);
      window.clearTimeout(playbackRef.current.holdTimeout);
    }

    phaseRef.current = "idle";
    pendingRef.current = null;
    armedHistoryRef.current = false;
    setRunId((current) => (current === id ? null : current));
  };

  beginRevealRef.current = (id: number) => {
    const playback = playbackRef.current;
    const pending = pendingRef.current;

    if (!playback || !pending || playback.id !== id || pending.id !== id) {
      return;
    }

    if (phaseRef.current !== "holding") {
      return;
    }

    if (pending.action.type === "push" && pathnameRef.current !== pending.pathname) {
      return;
    }

    if (
      pending.action.type === "back" &&
      pathnameRef.current === pending.fromPathname &&
      window.location.hash === pending.fromHash
    ) {
      return;
    }

    const holdRemaining = PAGE_PIXEL_TRANSITION.holdMs - (performance.now() - playback.coveredAt);
    if (holdRemaining > 0) {
      if (playback.holdTimeout) {
        return;
      }

      playback.holdTimeout = window.setTimeout(() => {
        playback.holdTimeout = 0;
        if (phaseRef.current === "holding" && pendingRef.current?.id === id) {
          beginRevealRef.current(id);
        }
      }, holdRemaining);
      return;
    }

    window.clearTimeout(playback.timeout);
    window.clearTimeout(playback.holdTimeout);
    playback.holdTimeout = 0;
    phaseRef.current = "revealing";
    playback.timeout = window.setTimeout(() => {
      if (phaseRef.current === "revealing" && pendingRef.current?.id === id) {
        finishRef.current(id);
      }
    }, PAGE_PIXEL_TRANSITION.revealMs + 300);

    if (playback.cells.length === 0) {
      finishRef.current(id);
      return;
    }

    const reveal = playPixelWave(
      playback.cells,
      playback.revealDelays,
      0,
      PAGE_PIXEL_TRANSITION.revealMs,
    );
    playback.reveal = reveal;
    reveal.eventCallback("onComplete", () => {
      if (playback.cancelled || phaseRef.current !== "revealing") {
        return;
      }

      finishRef.current(id);
    });
  };

  useLayoutEffect(() => {
    if (runId === null) {
      return;
    }

    const host = gridRef.current;
    if (!host) {
      finishRef.current(runId);
      return;
    }

    const pending = pendingRef.current;
    if (!pending || pending.id !== runId) {
      finishRef.current(runId);
      return;
    }

    const { cells, coverDelays, revealDelays } = createPixelGrid(host);
    const playback: Playback = {
      id: runId,
      cancelled: false,
      cells,
      revealDelays,
      cover: null,
      reveal: null,
      timeout: 0,
      holdTimeout: 0,
      coveredAt: 0,
    };
    playbackRef.current = playback;

    const cover = playPixelWave(cells, coverDelays, 1, PAGE_PIXEL_TRANSITION.coverMs);
    playback.cover = cover;
    cover.eventCallback("onComplete", () => {
      if (
        playback.cancelled ||
        phaseRef.current !== "covering" ||
        pendingRef.current?.id !== runId
      ) {
        return;
      }

      phaseRef.current = "holding";
      playback.coveredAt = performance.now();
      playback.timeout = window.setTimeout(() => {
        if (phaseRef.current === "holding" && pendingRef.current?.id === runId) {
          finishRef.current(runId);
        }
      }, PAGE_PIXEL_TRANSITION.navigationTimeoutMs);

      const current = pendingRef.current;
      if (!current) {
        return;
      }

      try {
        if (current.action.type === "back") {
          armedHistoryRef.current = true;
          routerRef.current.back();
        } else {
          // The shell applies hash or top scroll while the grid is still opaque.
          routerRef.current.push(current.action.href, { scroll: false });
        }
      } catch {
        finishRef.current(runId);
      }
    });

    return () => {
      playback.cancelled = true;
      playback.cover?.kill();
      playback.reveal?.kill();
      window.clearTimeout(playback.timeout);
      window.clearTimeout(playback.holdTimeout);
      if (playbackRef.current === playback) {
        playbackRef.current = null;
      }
      host.replaceChildren();
    };
  }, [runId]);

  useLayoutEffect(() => {
    const request = (action: PagePixelTransitionAction): StartResult => {
      if (prefersReducedMotion()) {
        return "bypass";
      }

      if (phaseRef.current !== "idle") {
        return "ignored";
      }

      const id = idRef.current + 1;
      idRef.current = id;
      const fromPathname = pathnameRef.current;
      let destinationPathname: string | null = null;

      if (action.type === "push") {
        const url = new URL(action.href, window.location.href);
        destinationPathname = url.pathname;

        if (destinationPathname === fromPathname) {
          return "bypass";
        }

        try {
          routerRef.current.prefetch(`${url.pathname}${url.search}`);
        } catch {
          // Navigation still proceeds if prefetch is unavailable.
        }
      }

      phaseRef.current = "covering";
      pendingRef.current = {
        id,
        action,
        pathname: destinationPathname,
        fromPathname,
        fromHash: window.location.hash,
      };
      setRunId(id);
      return "started";
    };

    const notifyScrollSettled = () => {
      const pending = pendingRef.current;
      if (!pending || phaseRef.current !== "holding") {
        return;
      }

      beginRevealRef.current(pending.id);
    };

    const onPopState = () => {
      if (armedHistoryRef.current) {
        armedHistoryRef.current = false;
        const pending = pendingRef.current;
        const destinationPathname = window.location.pathname;

        // Same-page history entries never change pathname, so the route effect
        // will not run. Reveal after the shell's hash scroll listener.
        if (pending && destinationPathname === pending.fromPathname) {
          window.requestAnimationFrame(() => {
            if (phaseRef.current === "holding" && pendingRef.current?.id === pending.id) {
              beginRevealRef.current(pending.id);
            }
          });
        }

        return;
      }

      if (phaseRef.current === "idle") {
        return;
      }

      finishRef.current(idRef.current);
    };

    requestImpl = request;
    notifyScrollSettledImpl = notifyScrollSettled;
    window.addEventListener("popstate", onPopState);

    return () => {
      if (requestImpl === request) {
        requestImpl = null;
      }

      if (notifyScrollSettledImpl === notifyScrollSettled) {
        notifyScrollSettledImpl = null;
      }

      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    if (runId === null) {
      return;
    }

    const blockScroll = (event: Event) => {
      event.preventDefault();
    };
    const blockScrollKeys = (event: KeyboardEvent) => {
      if (
        event.key === " " ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", blockScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
    window.addEventListener("keydown", blockScrollKeys, true);

    return () => {
      window.removeEventListener("wheel", blockScroll, { capture: true });
      window.removeEventListener("touchmove", blockScroll, { capture: true });
      window.removeEventListener("keydown", blockScrollKeys, true);
    };
  }, [runId]);

  const overlay =
    runId === null ? null : (
      <div aria-hidden="true" className="page-pixel-transition">
        <div className="page-pixel-transition__grid" ref={gridRef} />
      </div>
    );

  return { active: runId !== null, overlay };
}
