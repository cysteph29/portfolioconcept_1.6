"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PIXEL_FILL_COLOR = "#040F02";

type SectionTransitionConfig = {
  resolution: number;
  spread: number;
  fillDuration: number;
  layerHeight: string;
  mode: "reveal";
  revealStart: string;
  revealScrubDistance: number;
  mobile: {
    breakpoint: number;
    resolution?: number;
  };
};

type Cleanup = () => void;

const DEFAULT_CONFIG: SectionTransitionConfig = {
  resolution: 20,
  spread: 5,
  fillDuration: 0.03,
  layerHeight: "64vh",
  mode: "reveal",
  revealStart: "top bottom",
  revealScrubDistance: 0.65,
  mobile: {
    breakpoint: 768,
  },
};

const isScope = (value: unknown): value is Element | Document =>
  value instanceof Element || value instanceof Document;

const getConfig = (overrides: Partial<SectionTransitionConfig> = {}): SectionTransitionConfig => ({
  ...DEFAULT_CONFIG,
  ...overrides,
  mobile: {
    ...DEFAULT_CONFIG.mobile,
    ...(overrides.mobile || {}),
  },
});

const getPositiveInt = (value: unknown, fallback: number) => {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const getPositiveFloat = (value: unknown, fallback: number) => {
  const parsedValue = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const getCssSize = (value: unknown, fallback: string) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
};

const isMobileViewport = (config: SectionTransitionConfig) =>
  window.matchMedia(`(max-width: ${config.mobile.breakpoint}px)`).matches;

const getResolution = (section: HTMLElement, config: SectionTransitionConfig, isMobile: boolean) => {
  const desktopResolution = getPositiveInt(
    section.getAttribute("data-st-03"),
    getPositiveInt(config.resolution, DEFAULT_CONFIG.resolution),
  );

  if (!isMobile) {
    return desktopResolution;
  }

  return getPositiveInt(
    section.dataset.stMobileResolution,
    getPositiveInt(config.mobile.resolution, desktopResolution),
  );
};

const hash = (index: number) => {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const resolveLayerHost = (section: HTMLElement) =>
  section.querySelector<HTMLElement>("[data-st-03-layer-host]") ?? section;

const createPixelLayer = (
  section: HTMLElement,
  columnCount: number,
  layerHeight: string,
  mode: SectionTransitionConfig["mode"],
): { cleanup: Cleanup; columns: number; layer: HTMLDivElement; rows: number; cells: HTMLSpanElement[] } => {
  const layerHost = resolveLayerHost(section);
  const previousStyles = {
    isolation: layerHost.style.isolation,
    overflow: layerHost.style.overflow,
    position: layerHost.style.position,
  };
  const computedStyles = getComputedStyle(layerHost);

  if (computedStyles.position === "static") {
    layerHost.style.position = "relative";
  }

  if (computedStyles.isolation !== "isolate") {
    layerHost.style.isolation = "isolate";
  }

  if (!["hidden", "clip"].includes(computedStyles.overflow)) {
    layerHost.style.overflow = "hidden";
  }

  const layer = document.createElement("div");
  layer.setAttribute("data-st-03-pixels", "");
  layer.setAttribute("aria-hidden", "true");

  const revealLayerStyles =
    mode === "reveal"
      ? {
          bottom: "0",
          height: "100%",
          top: "0",
        }
      : {
          bottom: "0",
          height: layerHeight,
          top: "auto",
        };

  Object.assign(layer.style, {
    position: "absolute",
    left: "0",
    right: "0",
    ...revealLayerStyles,
    zIndex: "4",
    pointerEvents: "none",
  });

  layerHost.append(layer);

  const layerWidth = layer.offsetWidth;
  const layerHeightPx = layer.offsetHeight;
  const cellSize = layerWidth / columnCount;
  const rowCount = Math.max(Math.ceil(layerHeightPx / cellSize), 1);

  Object.assign(layer.style, {
    display: "grid",
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
  });

  const totalCells = columnCount * rowCount;
  const cells = Array.from({ length: totalCells }, () => {
    const cell = document.createElement("span");
    cell.setAttribute("data-st-03-cell", "");

    Object.assign(cell.style, {
      display: "block",
      width: "100%",
      height: "100%",
      background: PIXEL_FILL_COLOR,
      backfaceVisibility: "hidden",
    });

    layer.append(cell);
    return cell;
  });

  gsap.set(cells, { opacity: 1 });

  return {
    layer,
    cells,
    rows: rowCount,
    columns: columnCount,
    cleanup: () => {
      layer.remove();
      layerHost.style.position = previousStyles.position;
      layerHost.style.isolation = previousStyles.isolation;
      layerHost.style.overflow = previousStyles.overflow;
    },
  };
};

function sectionTransition03(scopeOrConfig: Element | Document | Partial<SectionTransitionConfig> = document) {
  const scope = isScope(scopeOrConfig) ? scopeOrConfig : document;
  const config = getConfig(isScope(scopeOrConfig) ? {} : scopeOrConfig);
  const isMobile = isMobileViewport(config);
  const cleanups: Cleanup[] = [];

  scope.querySelectorAll("[data-st-03-pixels]").forEach((layer) => layer.remove());

  const sections = scope.querySelectorAll<HTMLElement>("[data-st-03]");

  sections.forEach((section) => {
    const previousSection = section.previousElementSibling;

    if (!(previousSection instanceof Element)) {
      return;
    }

    const resolution = getResolution(section, config, isMobile);
    const spread = getPositiveInt(section.dataset.stSpread, config.spread);
    const fillDuration = getPositiveFloat(section.dataset.stFillDuration, config.fillDuration);
    const layerHeight = getCssSize(config.layerHeight, DEFAULT_CONFIG.layerHeight);
    const { layer, cells, rows, columns, cleanup } = createPixelLayer(
      section,
      resolution,
      layerHeight,
      config.mode,
    );
    const revealScrubDistance = getPositiveFloat(
      config.revealScrubDistance,
      DEFAULT_CONFIG.revealScrubDistance,
    );
    const maxDelay = Math.max(rows - 1 + spread, 1);
    const cellDelays = cells.map((_, index) => {
      const row = Math.floor(index / columns);
      const rowFromBottom = rows - 1 - row;

      return (rowFromBottom + hash(index) * spread) / maxDelay;
    });

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: config.revealStart,
        end: () => `+=${Math.max(layer.offsetHeight * revealScrubDistance, 1)}`,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline.to(
      cells,
      {
        duration: fillDuration,
        opacity: 0,
        stagger: (index) => cellDelays[index] ?? 0,
      },
      0,
    );

    cleanups.push(() => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      cleanup();
    });
  });

  ScrollTrigger.refresh();

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    ScrollTrigger.refresh();
  };
}

export function SectionTransition03() {
  useEffect(() => {
    let cleanup: Cleanup | undefined;
    let initTimeout: number | undefined;
    let resizeTimeout: number | undefined;
    let frame = 0;
    let nestedFrame = 0;

    const init = () => {
      const homePage = document.querySelector(".home-page");

      if (!homePage) {
        return;
      }

      cleanup?.();
      cleanup = sectionTransition03(homePage);
    };

    const scheduleInit = () => {
      initTimeout = window.setTimeout(init, 0);
      frame = window.requestAnimationFrame(() => {
        nestedFrame = window.requestAnimationFrame(init);
      });
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(init, 150);
    };

    scheduleInit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(nestedFrame);
      window.clearTimeout(initTimeout);
      window.clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      cleanup?.();
    };
  }, []);

  return null;
}
