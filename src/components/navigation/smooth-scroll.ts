import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP 3.15 initializes lag smoothing at these values and does not expose a getter.
 * `lagSmoothing(0)` disables it because a falsy threshold is stored as Infinity.
 * This app never sets another override, so leaving Lenis restores these defaults.
 */
const GSAP_LAG_THRESHOLD = 500;
const GSAP_ADJUSTED_LAG = 33;

export const PAGE_TRANSITION_LOCK = "page-transition";
export const IMAGE_PREVIEW_LOCK = "image-preview";

const LENIS_LERP = 0.075;

const locks = new Set<string>();

let lenis: Lenis | null = null;
let tickerTick: ((time: number) => void) | null = null;
let lagSmoothingDisabled = false;
let reducedMotion = false;
let scrollBehaviorSnapshot: string | null = null;
let scrollBehaviorObserver: MutationObserver | null = null;

function disableLagSmoothing() {
  if (lagSmoothingDisabled) {
    return;
  }

  gsap.ticker.lagSmoothing(0);
  lagSmoothingDisabled = true;
}

function restoreLagSmoothing() {
  if (!lagSmoothingDisabled) {
    return;
  }

  gsap.ticker.lagSmoothing(GSAP_LAG_THRESHOLD, GSAP_ADJUSTED_LAG);
  lagSmoothingDisabled = false;
}

function destroyLenis() {
  if (tickerTick) {
    gsap.ticker.remove(tickerTick);
    tickerTick = null;
  }

  if (lenis) {
    lenis.off("scroll", ScrollTrigger.update);
    lenis.destroy();
    lenis = null;
  }

  restoreLagSmoothing();
}

function createLenis() {
  const instance = new Lenis({
    lerp: LENIS_LERP,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
    anchors: false,
  });

  const tick = (time: number) => {
    instance.raf(time * 1000);
  };

  instance.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  disableLagSmoothing();

  lenis = instance;
  tickerTick = tick;

  if (locks.size > 0) {
    instance.stop();
  }
}

function forceScrollBehaviorAuto() {
  const html = document.documentElement;

  if (scrollBehaviorSnapshot === null) {
    scrollBehaviorSnapshot = html.style.scrollBehavior;
  }

  html.style.scrollBehavior = "auto";

  if (scrollBehaviorObserver) {
    return;
  }

  // Route transitions and the browser can write this inline style back.
  // Keep the override in place for the whole time Lenis or reduced motion owns scrolling.
  scrollBehaviorObserver = new MutationObserver(() => {
    if (html.style.scrollBehavior !== "auto") {
      html.style.scrollBehavior = "auto";
    }
  });
  scrollBehaviorObserver.observe(html, { attributes: true, attributeFilter: ["style"] });
}

function releaseScrollBehaviorOverride() {
  scrollBehaviorObserver?.disconnect();
  scrollBehaviorObserver = null;

  if (scrollBehaviorSnapshot === null) {
    return;
  }

  const html = document.documentElement;

  if (scrollBehaviorSnapshot) {
    html.style.scrollBehavior = scrollBehaviorSnapshot;
  } else {
    html.style.removeProperty("scroll-behavior");
  }

  scrollBehaviorSnapshot = null;
}

function flushScrollStyles() {
  void document.documentElement.clientHeight;
}

/**
 * Lenis's stopped class sets `overflow: clip`, which blocks programmatic
 * scrolling. Lift that lock, run the native write, then sync Lenis to the
 * resulting window position and restore the lock if one is still held.
 */
export function applyNativeScroll(write: () => void) {
  const resumeStop = Boolean(lenis?.isStopped);

  if (resumeStop) {
    lenis?.start();
    flushScrollStyles();
  }

  write();

  if (!lenis) {
    return;
  }

  lenis.scrollTo(window.scrollY, { immediate: true, force: true });

  if (resumeStop && locks.size > 0) {
    lenis.stop();
  }
}

function alignedScrollTop(element: HTMLElement, block: "start" | "end") {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
  const marginBottom = Number.parseFloat(style.scrollMarginBottom) || 0;

  if (block === "end") {
    return window.scrollY + rect.bottom + marginBottom - window.innerHeight;
  }

  return window.scrollY + rect.top - marginTop;
}

export function configurePageScroll(prefersReducedMotion: boolean) {
  reducedMotion = prefersReducedMotion;
  const x = window.scrollX;
  const y = window.scrollY;

  destroyLenis();
  forceScrollBehaviorAuto();

  if (!prefersReducedMotion) {
    createLenis();
    if (window.scrollX !== x || window.scrollY !== y) {
      window.scrollTo({ left: x, top: y, behavior: "instant" });
    }
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
    if (locks.size > 0) {
      lenis?.stop();
    }
  }
}

export function releasePageScroll() {
  destroyLenis();
  releaseScrollBehaviorOverride();
}

export function lockPageScroll(reason: string) {
  const alreadyHeld = locks.has(reason);
  locks.add(reason);

  if (!alreadyHeld) {
    lenis?.stop();
  }
}

export function unlockPageScroll(reason: string) {
  if (!locks.delete(reason)) {
    return;
  }

  if (locks.size === 0 && lenis?.isStopped) {
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    lenis.start();
  }
}

export function resizePageScroll() {
  lenis?.resize();
}

/** Match Lenis's internal target to the window without clearing a scroll lock. */
export function reconcilePageScroll() {
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
}

export function scrollToPosition(x: number, y: number) {
  applyNativeScroll(() => {
    window.scrollTo({ left: x, top: y, behavior: "instant" });
  });
}

export function scrollToElement(
  element: HTMLElement,
  options: { block: "start" | "end"; behavior: "instant" | "smooth" },
) {
  const animateWithLenis = Boolean(lenis) && options.behavior === "smooth" && !reducedMotion && locks.size === 0;

  if (!animateWithLenis) {
    applyNativeScroll(() => {
      element.scrollIntoView({
        block: options.block,
        inline: "nearest",
        behavior:
          options.behavior === "smooth" && !reducedMotion && locks.size === 0 ? "smooth" : "instant",
      });
    });
    return;
  }

  lenis?.scrollTo(alignedScrollTop(element, options.block));
}
