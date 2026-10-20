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
  | { type: "back" }
  | { type: "traverse"; pathname: string };

type StartResult = "started" | "ignored" | "bypass";

type PendingTransition = {
  id: number;
  action: PagePixelTransitionAction;
  pathname: string | null;
  fromPathname: string;
  fromHash: string;
  /** Browser history reveals only after native scroll restoration. */
  scrollReady: boolean;
  token: number;
};

type TraverseGate = {
  promise: Promise<void>;
  finish: () => void;
};

type TraverseNavigateEvent = Event & {
  navigationType: string;
  canIntercept: boolean;
  hashChange: boolean;
  hasUAVisualTransition: boolean;
  destination: { url: string; sameDocument: boolean; key?: string };
  signal: AbortSignal;
  intercept: (options: {
    precommitHandler?: () => Promise<void> | void;
    handler?: () => Promise<void> | void;
    focusReset?: "manual";
    scroll?: "manual";
  }) => void;
  scroll: () => void;
};

/**
 * Set when a trusted popstate commits. The shell must not force scroll-to-top
 * for that pathname, or it overwrites native scroll restoration.
 */
let historyScrollPathname: string | null = null;
const historyScrollPoints = new Map<string, { x: number; y: number }>();

function historyEntryKey() {
  const navigation = (
    window as Window & { navigation?: { currentEntry?: { key?: string } | null } }
  ).navigation;

  return navigation?.currentEntry?.key ?? null;
}

function rememberHistoryScroll() {
  const key = historyEntryKey();

  if (!key) {
    return;
  }

  historyScrollPoints.set(key, { x: window.scrollX, y: window.scrollY });
}

export function isBrowserHistoryScroll(pathname: string) {
  if (historyScrollPathname === null) {
    return false;
  }

  if (historyScrollPathname === pathname) {
    return true;
  }

  historyScrollPathname = null;
  return false;
}

type Playback = {
  id: number;
  cancelled: boolean;
  cells: HTMLSpanElement[];
  revealDelays: number[];
  cover: gsap.core.Timeline | null;
  reveal: gsap.core.Timeline | null;
  pump: number;
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

/**
 * Step a paused timeline from timers. Browser history precommit suppresses
 * animation frames, which stalls GSAP's own ticker.
 */
function runOnTimer(timeline: gsap.core.Timeline, storeTimer: (timer: number) => void) {
  timeline.pause();
  const started = performance.now();
  const duration = timeline.duration();

  const step = () => {
    const elapsed = (performance.now() - started) / 1000;
    timeline.time(Math.min(elapsed, duration));

    if (elapsed < duration) {
      storeTimer(window.setTimeout(step, 16));
    }
  };

  storeTimer(window.setTimeout(step, 16));
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
  const traverseTokenRef = useRef(0);
  const traverseGateRef = useRef<TraverseGate | null>(null);

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

    traverseGateRef.current?.finish();
    traverseGateRef.current = null;
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

    if (pending.action.type === "traverse" && !pending.scrollReady) {
      return;
    }

    if (
      (pending.action.type === "push" || pending.action.type === "traverse") &&
      pathnameRef.current !== pending.pathname
    ) {
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
    runOnTimer(reveal, (timer) => {
      if (playback.cancelled || playback.reveal !== reveal) {
        window.clearTimeout(timer);
        return;
      }

      playback.pump = timer;
    });
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
      pump: 0,
      timeout: 0,
      holdTimeout: 0,
      coveredAt: 0,
    };
    playbackRef.current = playback;

    const cover = playPixelWave(cells, coverDelays, 1, PAGE_PIXEL_TRANSITION.coverMs);
    playback.cover = cover;
    runOnTimer(cover, (timer) => {
      if (playback.cancelled || playback.cover !== cover) {
        window.clearTimeout(timer);
        return;
      }

      playback.pump = timer;
    });
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
        if (current.action.type === "traverse") {
          // The browser commits this history entry when the precommit handler returns.
          traverseGateRef.current?.finish();
        } else if (current.action.type === "back") {
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
      window.clearTimeout(playback.pump);
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

      rememberHistoryScroll();

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
      } else if (action.type === "traverse") {
        destinationPathname = action.pathname;

        if (destinationPathname === fromPathname) {
          return "bypass";
        }

        let settled = false;
        let finishGate = () => {};
        const promise = new Promise<void>((resolve) => {
          finishGate = () => {
            if (settled) {
              return;
            }

            settled = true;
            resolve();
          };
        });
        traverseGateRef.current = { promise, finish: finishGate };
      }

      phaseRef.current = "covering";
      pendingRef.current = {
        id,
        action,
        pathname: destinationPathname,
        fromPathname,
        fromHash: window.location.hash,
        scrollReady: false,
        token: traverseTokenRef.current,
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

    const onPopState = (event: PopStateEvent) => {
      if (event.isTrusted) {
        historyScrollPathname = window.location.pathname;
      }

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

      if (pendingRef.current?.action.type === "traverse") {
        return;
      }

      if (phaseRef.current === "idle") {
        return;
      }

      finishRef.current(idRef.current);
    };

    const ensureTraverseCover = (pathname: string, token: number) => {
      const pending = pendingRef.current;

      if (pending?.action.type === "traverse") {
        pending.pathname = pathname;
        pending.token = token;
        pending.scrollReady = false;

        const playback = playbackRef.current;
        if (phaseRef.current === "revealing" && playback) {
          playback.reveal?.kill();
          playback.reveal = null;
          window.clearTimeout(playback.timeout);
          if (playback.cells.length > 0) {
            gsap.set(playback.cells, { opacity: 1 });
          }
          phaseRef.current = "holding";
          playback.timeout = window.setTimeout(() => {
            if (phaseRef.current === "holding" && pendingRef.current?.id === playback.id) {
              finishRef.current(playback.id);
            }
          }, PAGE_PIXEL_TRANSITION.navigationTimeoutMs);
        }

        return;
      }

      if (phaseRef.current !== "idle") {
        return;
      }

      const started = request({ type: "traverse", pathname });
      if (started === "started" && pendingRef.current) {
        pendingRef.current.token = token;
      }
    };

    const onNavigate = (event: TraverseNavigateEvent) => {
      if (event.navigationType !== "traverse" || !event.canIntercept || !event.cancelable) {
        return;
      }

      if (
        event.hashChange ||
        event.hasUAVisualTransition ||
        !event.destination.sameDocument ||
        armedHistoryRef.current ||
        prefersReducedMotion()
      ) {
        return;
      }

      const ownNavigation = pendingRef.current;
      if (
        ownNavigation &&
        (ownNavigation.action.type === "push" || ownNavigation.action.type === "back")
      ) {
        return;
      }

      let destination: URL;
      try {
        destination = new URL(event.destination.url, window.location.href);
      } catch {
        return;
      }

      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      ) {
        return;
      }

      const token = traverseTokenRef.current + 1;
      traverseTokenRef.current = token;
      rememberHistoryScroll();
      historyScrollPathname = destination.pathname;

      try {
        event.intercept({
          focusReset: "manual",
          scroll: "manual",
          precommitHandler: async () => {
            const superseded = async () => {
              if (event.signal.aborted) {
                return;
              }

              await new Promise<void>((resolve) => {
                const timeout = window.setTimeout(resolve, PAGE_PIXEL_TRANSITION.navigationTimeoutMs);
                event.signal.addEventListener(
                  "abort",
                  () => {
                    window.clearTimeout(timeout);
                    resolve();
                  },
                  { once: true },
                );
              });
            };

            if (event.signal.aborted || traverseTokenRef.current !== token) {
              await superseded();
              return;
            }

            ensureTraverseCover(destination.pathname, token);
            if (event.signal.aborted || pendingRef.current?.token !== token) {
              await superseded();
              return;
            }

            const gate = traverseGateRef.current;
            if (gate) {
              await gate.promise;
            }

            if (event.signal.aborted || pendingRef.current?.token !== token) {
              await superseded();
            }
          },
          handler() {
            // Return immediately. Waiting here for React blocks the traversal
            // that Next.js needs before it can render the destination.
            const saved = event.destination.key
              ? historyScrollPoints.get(event.destination.key)
              : undefined;

            if (!saved) {
              try {
                event.scroll();
              } catch {
                // A superseded traversal can no longer restore scroll.
              }
            }

            const started = performance.now();

            const watch = () => {
              const pending = pendingRef.current;
              if (!pending || pending.token !== token || pending.action.type !== "traverse") {
                return;
              }

              if (pathnameRef.current !== pending.pathname) {
                if (performance.now() - started < PAGE_PIXEL_TRANSITION.navigationTimeoutMs) {
                  window.setTimeout(watch, 16);
                } else {
                  finishRef.current(pending.id);
                }
                return;
              }

              if (saved) {
                window.scrollTo(saved.x, saved.y);
              }

              pending.scrollReady = true;
              beginRevealRef.current(pending.id);

              if (!saved) {
                return;
              }

              window.setTimeout(() => {
                if (window.location.pathname !== pending.pathname) {
                  return;
                }

                if (Math.abs(window.scrollY - saved.y) > 1 || Math.abs(window.scrollX - saved.x) > 1) {
                  window.scrollTo(saved.x, saved.y);
                }
              }, 200);
            };

            window.setTimeout(watch, 0);
          },
        });
      } catch {
        if (traverseTokenRef.current === token) {
          traverseTokenRef.current = token - 1;
          historyScrollPathname = null;
        }
        return;
      }

      event.signal.addEventListener(
        "abort",
        () => {
          window.queueMicrotask(() => {
            if (traverseTokenRef.current !== token) {
              return;
            }

            const pending = pendingRef.current;
            if (pending?.action.type !== "traverse" || pending.token !== token) {
              return;
            }

            // Next.js follows a traverse with its own replace. That can abort the
            // intercepted signal after the destination is already committed.
            if (window.location.pathname === pending.pathname) {
              return;
            }

            finishRef.current(pending.id);
          });
        },
        { once: true },
      );
    };

    const navigation = (
      window as Window & {
        navigation?: {
          addEventListener(type: "navigate", listener: (event: TraverseNavigateEvent) => void): void;
          removeEventListener(type: "navigate", listener: (event: TraverseNavigateEvent) => void): void;
        };
      }
    ).navigation;

    const onScroll = () => {
      if (phaseRef.current !== "idle") {
        return;
      }

      rememberHistoryScroll();
    };

    requestImpl = request;
    notifyScrollSettledImpl = notifyScrollSettled;
    rememberHistoryScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPopState);
    navigation?.addEventListener("navigate", onNavigate);

    return () => {
      if (requestImpl === request) {
        requestImpl = null;
      }

      if (notifyScrollSettledImpl === notifyScrollSettled) {
        notifyScrollSettledImpl = null;
      }

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPopState);
      navigation?.removeEventListener("navigate", onNavigate);
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
