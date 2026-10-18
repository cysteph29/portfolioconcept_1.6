"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildFigureCells,
  getFigureGlyphSeed,
  type CapabilityFigureId,
  type FigureCell,
  type FigureInk,
} from "@/components/home/capability-figures";

import "@/app/trial/trial.module.css";

const CAPABILITY_CANVAS_CONFIG = {
  cellSize: 8,
  glyphScale: 0.75,
  microDotSize: 1,
  cream: "rgba(249, 244, 241, 0.62)",
  lime: "rgba(124, 255, 107, 0.82)",
  resizeDebounceMs: 120,
  sampling: {
    alphaThreshold: 0.15,
    fontSize: 128,
    offscreenSize: 256,
  },
  minStrokeThreshold: 0.08,
} as const;

const MALAYALAM_GLYPH_POOL = ["അ", "ആ", "ഇ", "ഉ", "ക", "ഗ", "മ", "യ", "ര", "ല", "വ", "സ"] as const;

type CanvasMetrics = {
  dpr: number;
  height: number;
  width: number;
};

type RenderedDot = {
  height: number;
  ink: FigureInk;
  width: number;
  x: number;
  y: number;
};

type GlyphBitmap = {
  cells: Array<{ column: number; row: number }>;
  glyph: string;
  height: number;
  width: number;
};

type InkBounds = {
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  width: number;
};

const glyphBitmapCache = new Map<string, GlyphBitmap>();

function getCellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function renderAndMeasureGlyph(context: CanvasRenderingContext2D, glyph: string, fontSize: number): InkBounds | null {
  const { offscreenSize } = CAPABILITY_CANVAS_CONFIG.sampling;
  context.canvas.width = offscreenSize;
  context.canvas.height = offscreenSize;
  context.clearRect(0, 0, offscreenSize, offscreenSize);
  context.font = `${fontSize}px "Manjari"`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#000";
  context.fillText(glyph, offscreenSize / 2, offscreenSize / 2);

  const image = context.getImageData(0, 0, offscreenSize, offscreenSize).data;
  let minX: number = offscreenSize;
  let minY: number = offscreenSize;
  let maxX: number = -1;
  let maxY: number = -1;

  for (let y = 0; y < offscreenSize; y += 1) {
    for (let x = 0; x < offscreenSize; x += 1) {
      if (image[(y * offscreenSize + x) * 4 + 3] === 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return { height: maxY - minY + 1, maxX, maxY, minX, minY, width: maxX - minX + 1 };
}

function sampleGlyphBitmap(
  context: CanvasRenderingContext2D,
  glyph: string,
  fontSize: number,
  bitmapBudget: number,
  coverageThreshold: number,
): GlyphBitmap | null {
  const { offscreenSize } = CAPABILITY_CANVAS_CONFIG.sampling;
  const { minStrokeThreshold } = CAPABILITY_CANVAS_CONFIG;
  const bounds = renderAndMeasureGlyph(context, glyph, fontSize);

  if (!bounds) {
    console.error("Capability figure sampling produced no ink", { glyph });
    return null;
  }

  const image = context.getImageData(0, 0, offscreenSize, offscreenSize).data;
  const scale = Math.min(bitmapBudget / bounds.width, bitmapBudget / bounds.height);
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  const coverageGrid = Array.from({ length: height }, () => Array<number>(width).fill(0));
  const cells: GlyphBitmap["cells"] = [];

  for (let row = 0; row < height; row += 1) {
    const fromY = Math.floor(bounds.minY + (row * bounds.height) / height);
    const toY = Math.max(fromY + 1, Math.floor(bounds.minY + ((row + 1) * bounds.height) / height));

    for (let column = 0; column < width; column += 1) {
      const fromX = Math.floor(bounds.minX + (column * bounds.width) / width);
      const toX = Math.max(fromX + 1, Math.floor(bounds.minX + ((column + 1) * bounds.width) / width));
      let alphaSum = 0;
      let sampleCount = 0;

      for (let y = fromY; y < toY; y += 1) {
        for (let x = fromX; x < toX; x += 1) {
          alphaSum += image[(y * offscreenSize + x) * 4 + 3] / 255;
          sampleCount += 1;
        }
      }

      const coverage = alphaSum / sampleCount;
      coverageGrid[row][column] = coverage;

      if (coverage >= coverageThreshold) {
        cells.push({ column, row });
      }
    }
  }

  const activeCells = new Set(cells.map(({ column, row }) => getCellKey(column, row)));
  const promoteStrongest = (candidates: Array<{ column: number; row: number }>) => {
    const strongest = candidates.reduce<{ column: number; row: number; coverage: number } | null>(
      (best, candidate) => {
        const coverage = coverageGrid[candidate.row][candidate.column];
        return !best || coverage > best.coverage ? { ...candidate, coverage } : best;
      },
      null,
    );

    if (strongest && strongest.coverage >= minStrokeThreshold) {
      activeCells.add(getCellKey(strongest.column, strongest.row));
    }
  };

  for (let column = 0; column < width; column += 1) {
    if (![...activeCells].some((key) => key.startsWith(`${column}:`))) {
      promoteStrongest(Array.from({ length: height }, (_, row) => ({ column, row })));
    }
  }

  for (let row = 0; row < height; row += 1) {
    if (![...activeCells].some((key) => key.endsWith(`:${row}`))) {
      promoteStrongest(Array.from({ length: width }, (_, column) => ({ column, row })));
    }
  }

  return {
    cells: [...activeCells].map((key) => {
      const [column, row] = key.split(":").map(Number);
      return { column, row };
    }),
    glyph,
    height,
    width,
  };
}

async function loadManjariFont() {
  const font = '96px "Manjari"';
  const glyphs = MALAYALAM_GLYPH_POOL.join("");

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await document.fonts.load(font, glyphs);
    } catch (error) {
      console.warn("Manjari font load attempt failed", { attempt, error });
      continue;
    }

    if (document.fonts.check(font, glyphs)) {
      return true;
    }
  }

  console.warn("Manjari font unavailable for capability figures", { requestedFont: font });
  return false;
}

function buildGlyphBitmaps() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    console.error("Capability figure sampling aborted: offscreen context unavailable");
    return [];
  }

  const { cellSize, glyphScale, microDotSize, sampling } = CAPABILITY_CANVAS_CONFIG;
  const referenceBounds = renderAndMeasureGlyph(context, "അ", sampling.fontSize);

  if (!referenceBounds) {
    console.error("Capability figure sampling aborted: reference glyph unavailable");
    return [];
  }

  const bitmapBudget = Math.max(1, Math.floor((cellSize * glyphScale) / microDotSize));

  return MALAYALAM_GLYPH_POOL.flatMap((glyph) => {
    const cacheKey = `${glyph}:${bitmapBudget}:${sampling.alphaThreshold}`;
    const cachedBitmap = glyphBitmapCache.get(cacheKey);

    if (cachedBitmap) {
      return [cachedBitmap];
    }

    const glyphBounds = renderAndMeasureGlyph(context, glyph, sampling.fontSize);
    const normalizedFontSize = glyphBounds
      ? sampling.fontSize * (referenceBounds.height / glyphBounds.height)
      : sampling.fontSize;
    const bitmap = sampleGlyphBitmap(
      context,
      glyph,
      normalizedFontSize,
      bitmapBudget,
      sampling.alphaThreshold,
    );

    if (bitmap) {
      glyphBitmapCache.set(cacheKey, bitmap);
      return [bitmap];
    }

    return [];
  });
}

function buildRenderedDots(cells: Map<string, FigureCell>, glyphBitmaps: GlyphBitmap[]) {
  const { cellSize, microDotSize } = CAPABILITY_CANVAS_CONFIG;
  const bitmapsByGlyph = new Map(glyphBitmaps.map((bitmap) => [bitmap.glyph, bitmap]));

  return [...cells.values()].flatMap((cell) => {
    const glyph = MALAYALAM_GLYPH_POOL[Math.floor(getFigureGlyphSeed(cell.column, cell.row) * MALAYALAM_GLYPH_POOL.length)];
    const bitmap = bitmapsByGlyph.get(glyph);

    if (!bitmap) {
      return [];
    }

    const offsetX = (cellSize - bitmap.width * microDotSize) / 2;
    const offsetY = (cellSize - bitmap.height * microDotSize) / 2;

    return bitmap.cells.map(({ column, row }) => ({
      height: microDotSize,
      ink: cell.ink,
      width: microDotSize,
      x: cell.column * cellSize + offsetX + column * microDotSize,
      y: cell.row * cellSize + offsetY + row * microDotSize,
    }));
  });
}

function paintDots(context: CanvasRenderingContext2D, dots: RenderedDot[]) {
  const { cream, lime } = CAPABILITY_CANVAS_CONFIG;

  context.fillStyle = cream;
  for (const dot of dots) {
    if (dot.ink === "cream") {
      context.fillRect(dot.x, dot.y, dot.width, dot.height);
    }
  }

  context.fillStyle = lime;
  for (const dot of dots) {
    if (dot.ink === "lime") {
      context.fillRect(dot.x, dot.y, dot.width, dot.height);
    }
  }
}

type CapabilityCanvasProps = {
  figure: CapabilityFigureId;
};

export function CapabilityCanvas({ figure }: CapabilityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const [glyphBitmaps, setGlyphBitmaps] = useState<GlyphBitmap[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    void document.fonts.ready
      .then(() => loadManjariFont())
      .then(() => {
        if (cancelled) {
          return;
        }

        const bitmaps = buildGlyphBitmaps();

        if (bitmaps.length > 0) {
          setGlyphBitmaps(bitmaps);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !glyphBitmaps || glyphBitmaps.length === 0) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const paint = () => {
      const { height, width } = metricsRef.current;

      if (width < 2 || height < 2) {
        return;
      }

      const cells = buildFigureCells(figure, width, height, CAPABILITY_CANVAS_CONFIG.cellSize);
      const dots = buildRenderedDots(cells, glyphBitmaps);

      context.clearRect(0, 0, width, height);
      paintDots(context, dots);
    };

    const resizeCanvas = () => {
      const { height, width } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      metricsRef.current = { dpr, height, width };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    let resizeTimer: number | null = null;
    const scheduleResize = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        resizeCanvas();
      }, CAPABILITY_CANVAS_CONFIG.resizeDebounceMs);
    };

    const resizeObserver = new ResizeObserver(scheduleResize);

    resizeObserver.observe(canvas);
    window.addEventListener("resize", scheduleResize);
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, [figure, glyphBitmaps]);

  return <canvas className="what-i-bring__canvas" ref={canvasRef} />;
}
