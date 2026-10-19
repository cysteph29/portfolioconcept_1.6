"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildFigureCells,
  getFigureGlyphSeed,
  SPECIMEN_GLYPH,
  type CapabilityFigureId,
  type FigureCell,
  type FigureTone,
  type GlyphMask,
} from "@/components/home/capability-figures";

import "@/app/trial/trial.module.css";

const CAPABILITY_CANVAS_CONFIG = {
  cellSize: 8,
  glyphScale: 0.75,
  microDotSize: 1,
  tones: {
    faint: "rgba(249, 244, 241, 0.2)",
    mid: "rgba(249, 244, 241, 0.42)",
    full: "rgba(249, 244, 241, 0.7)",
    lime: "rgba(124, 255, 107, 0.85)",
  } satisfies Record<FigureTone, string>,
  resizeDebounceMs: 120,
  sampling: {
    alphaThreshold: 0.15,
    fontSize: 128,
    maskThreshold: 0.35,
    offscreenSize: 256,
  },
  minStrokeThreshold: 0.08,
} as const;

const TONE_ORDER: FigureTone[] = ["faint", "mid", "full", "lime"];

const MALAYALAM_GLYPH_POOL = ["അ", "ആ", "ഇ", "ഉ", "ക", "ഗ", "മ", "യ", "ര", "ല", "വ", "സ"] as const;

type CanvasMetrics = {
  dpr: number;
  height: number;
  width: number;
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
const glyphSetCache = new Map<string, GlyphBitmap[]>();
const glyphMaskCache = new Map<string, GlyphMask | null>();
let samplingContext: CanvasRenderingContext2D | null = null;
let glyphResourcesPromise: Promise<boolean> | null = null;

function getCellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function getSamplingContext() {
  if (!samplingContext) {
    samplingContext = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  }

  return samplingContext;
}

function resolveOffscreenSize(context: CanvasRenderingContext2D, glyph: string, fontSize: number) {
  const base = CAPABILITY_CANVAS_CONFIG.sampling.offscreenSize;

  if ([...glyph].length <= 1) {
    return base;
  }

  context.font = `${fontSize}px "Manjari"`;
  const metrics = context.measureText(glyph);
  const width = Math.ceil(metrics.width);
  const height = Math.ceil(
    (metrics.actualBoundingBoxAscent || fontSize) + (metrics.actualBoundingBoxDescent || fontSize * 0.5),
  );

  return Math.max(base, width + 32, height + 32);
}

function renderAndMeasureGlyph(context: CanvasRenderingContext2D, glyph: string, fontSize: number): InkBounds | null {
  const offscreenSize = resolveOffscreenSize(context, glyph, fontSize);
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
  fit: "max" | "height" = "max",
): GlyphBitmap | null {
  const { minStrokeThreshold } = CAPABILITY_CANVAS_CONFIG;
  const bounds = renderAndMeasureGlyph(context, glyph, fontSize);

  if (!bounds) {
    console.error("Capability figure sampling produced no ink", { glyph });
    return null;
  }

  const offscreenSize = context.canvas.width;
  const image = context.getImageData(0, 0, offscreenSize, offscreenSize).data;
  const scale =
    fit === "height" ? bitmapBudget / bounds.height : Math.min(bitmapBudget / bounds.width, bitmapBudget / bounds.height);
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
  const glyphs = `${MALAYALAM_GLYPH_POOL.join("")}${SPECIMEN_GLYPH}ലിപിണ`;

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

function loadGlyphResources() {
  glyphResourcesPromise ??= document.fonts.ready.then(() => loadManjariFont());

  return glyphResourcesPromise;
}

/** The pool sampled at a given span and dot size, sorted from the lightest glyph to the heaviest. */
function getGlyphSet(span: number, microDotSize: number) {
  const setKey = `${span}:${microDotSize}`;
  const cached = glyphSetCache.get(setKey);

  if (cached) {
    return cached;
  }

  const context = getSamplingContext();

  if (!context) {
    console.error("Capability figure sampling aborted: offscreen context unavailable");
    return [];
  }

  const { cellSize, glyphScale, sampling } = CAPABILITY_CANVAS_CONFIG;
  const referenceBounds = renderAndMeasureGlyph(context, "അ", sampling.fontSize);

  if (!referenceBounds) {
    console.error("Capability figure sampling aborted: reference glyph unavailable");
    return [];
  }

  const bitmapBudget = Math.max(1, Math.floor((cellSize * span * glyphScale) / microDotSize));
  const bitmaps = MALAYALAM_GLYPH_POOL.flatMap((glyph) => {
    const cacheKey = `${glyph}:${bitmapBudget}:${sampling.alphaThreshold}`;
    const cachedBitmap = glyphBitmapCache.get(cacheKey);

    if (cachedBitmap) {
      return [cachedBitmap];
    }

    const glyphBounds = renderAndMeasureGlyph(context, glyph, sampling.fontSize);
    const normalizedFontSize = glyphBounds
      ? sampling.fontSize * (referenceBounds.height / glyphBounds.height)
      : sampling.fontSize;
    const bitmap = sampleGlyphBitmap(context, glyph, normalizedFontSize, bitmapBudget, sampling.alphaThreshold);

    if (bitmap) {
      glyphBitmapCache.set(cacheKey, bitmap);
      return [bitmap];
    }

    return [];
  });

  bitmaps.sort((a, b) => a.cells.length - b.cells.length);

  if (bitmaps.length > 0) {
    glyphSetCache.set(setKey, bitmaps);
  }

  return bitmaps;
}

function getGlyphMask(glyph: string, budget: number, fit: "max" | "height" = "max") {
  const cacheKey = `${glyph}:${budget}:${fit}`;

  if (glyphMaskCache.has(cacheKey)) {
    return glyphMaskCache.get(cacheKey) ?? null;
  }

  const context = getSamplingContext();
  const bitmap = context
    ? sampleGlyphBitmap(
        context,
        glyph,
        CAPABILITY_CANVAS_CONFIG.sampling.fontSize,
        budget,
        CAPABILITY_CANVAS_CONFIG.sampling.maskThreshold,
        fit,
      )
    : null;
  const mask = bitmap ? { cells: bitmap.cells, height: bitmap.height, width: bitmap.width } : null;

  glyphMaskCache.set(cacheKey, mask);
  return mask;
}

function pickGlyph(bitmaps: GlyphBitmap[], cell: FigureCell) {
  if (cell.glyph) {
    const named = bitmaps.find((bitmap) => bitmap.glyph === cell.glyph);

    if (named) {
      return named;
    }
  }

  const seed = getFigureGlyphSeed(cell.column, cell.row);

  if (cell.weight === undefined) {
    return bitmaps[Math.floor(seed * bitmaps.length)];
  }

  const center = Math.round(cell.weight * (bitmaps.length - 1));
  const from = Math.max(0, center - 1);
  const to = Math.min(bitmaps.length - 1, center + 1);

  return bitmaps[from + Math.floor(seed * (to - from + 1))];
}

function paintCells(
  context: CanvasRenderingContext2D,
  cells: Iterable<FigureCell>,
  origin: { x: number; y: number },
  microDotSize: number,
) {
  const { cellSize, tones } = CAPABILITY_CANVAS_CONFIG;
  const byTone = new Map<FigureTone, FigureCell[]>(TONE_ORDER.map((tone) => [tone, []]));

  for (const cell of cells) {
    byTone.get(cell.tone)?.push(cell);
  }

  for (const tone of TONE_ORDER) {
    context.fillStyle = tones[tone];

    for (const cell of byTone.get(tone) ?? []) {
      const span = cell.span ?? 1;
      const bitmap = pickGlyph(getGlyphSet(span, microDotSize), cell);

      if (!bitmap) {
        continue;
      }

      const blockSize = cellSize * span;
      const x = origin.x + cell.column * cellSize + (blockSize - bitmap.width * microDotSize) / 2;
      const y = origin.y + cell.row * cellSize + (blockSize - bitmap.height * microDotSize) / 2;

      for (const dot of bitmap.cells) {
        context.fillRect(x + dot.column * microDotSize, y + dot.row * microDotSize, microDotSize, microDotSize);
      }
    }
  }
}

type CapabilityCanvasProps = {
  figure: CapabilityFigureId;
};

export function CapabilityCanvas({ figure }: CapabilityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const [glyphsReady, setGlyphsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadGlyphResources().then((loaded) => {
      if (!cancelled && loaded && getGlyphSet(1, CAPABILITY_CANVAS_CONFIG.microDotSize).length > 0) {
        setGlyphsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !glyphsReady) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const paint = () => {
      const { dpr, height, width } = metricsRef.current;
      const { cellSize } = CAPABILITY_CANVAS_CONFIG;
      const microDotSize = dpr >= 2 ? CAPABILITY_CANVAS_CONFIG.microDotSize / 2 : CAPABILITY_CANVAS_CONFIG.microDotSize;

      if (width < cellSize || height < cellSize) {
        return;
      }

      const columns = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);
      const origin = {
        x: Math.floor((width - columns * cellSize) / 2),
        y: Math.floor((height - rows * cellSize) / 2),
      };
      const cells = buildFigureCells(figure, { columns, rows }, { glyphMask: getGlyphMask });

      context.clearRect(0, 0, width, height);
      paintCells(context, cells.values(), origin, microDotSize);
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
  }, [figure, glyphsReady]);

  return <canvas className="what-i-bring__canvas" ref={canvasRef} />;
}
