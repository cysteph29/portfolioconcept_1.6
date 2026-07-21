"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "@/app/trial/trial.module.css";

const BRAVURA_BRIDGE_CANVAS_CONFIG = {
  cellSize: 18,
  edgeDitherRate: 0.12,
  fadeDuration: 800,
  fillProbability: 0.95,
  glyphScale: 0.85,
  highlightRadius: 160,
  idleOpacity: 0.38,
  maxHighlightOpacity: 1,
  highlightColor: "#7cff6b",
  mainSpanSag: 0.88,
  microDotSize: 2,
  resizeDebounceMs: 120,
  sideCableSag: 0.15,
  sampling: {
    alphaThreshold: 0.2,
    fontSize: 128,
    offscreenSize: 256,
  },
  minStrokeThreshold: 0.08,
  densityTiers: {
    sparseMax: 1,
    lowMediumMax: 3,
    mediumDenseMax: 5,
  },
  fontFallback: "Mondwest, sans-serif",
} as const;

const BRAVURA_GLYPH_POOL = {
  active: ["\uE0A2", "\uE0A4", "\uE1D5", "\uE1D7", "\uE1D9", "\uE262", "\uE260", "\uE261", "\uE4E7", "\uE4E8"],
  disabled: ["\uE050", "\uE062", "\uE1DB", "\uE1E7"],
} as const;

type BravuraBridgeControls = {
  cellSize: number;
  fillProbability: number;
  glyphScale: number;
  highlightRadius: number;
  idleOpacity: number;
  mainSpanSag: number;
  sideCableSag: number;
  microDotSize: number;
  coverageThreshold: number;
};

const BRAVURA_BRIDGE_CONTROL_DEFAULTS: BravuraBridgeControls = {
  cellSize: BRAVURA_BRIDGE_CANVAS_CONFIG.cellSize,
  fillProbability: BRAVURA_BRIDGE_CANVAS_CONFIG.fillProbability,
  glyphScale: BRAVURA_BRIDGE_CANVAS_CONFIG.glyphScale,
  highlightRadius: BRAVURA_BRIDGE_CANVAS_CONFIG.highlightRadius,
  idleOpacity: BRAVURA_BRIDGE_CANVAS_CONFIG.idleOpacity,
  mainSpanSag: BRAVURA_BRIDGE_CANVAS_CONFIG.mainSpanSag,
  sideCableSag: BRAVURA_BRIDGE_CANVAS_CONFIG.sideCableSag,
  microDotSize: BRAVURA_BRIDGE_CANVAS_CONFIG.microDotSize,
  coverageThreshold: BRAVURA_BRIDGE_CANVAS_CONFIG.sampling.alphaThreshold,
};

type CanvasMetrics = {
  dpr: number;
  height: number;
  width: number;
};

type BridgeCell = {
  column: number;
  row: number;
};

type ActivePointer = {
  activatedAt: number;
  x: number;
  y: number;
};

function getCellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function getFalloff(distance: number, radius: number) {
  const linearFalloff = Math.max(0, 1 - distance / radius);

  return linearFalloff * linearFalloff * (3 - 2 * linearFalloff);
}

function getDeterministicValue(column: number, row: number, seed = 0) {
  const value = Math.sin(column * 12.9898 + row * 78.233 + seed * 37.719) * 43758.5453;

  return value - Math.floor(value);
}

type RenderedDot = {
  height: number;
  width: number;
  x: number;
  y: number;
};
type GlyphBitmap = {
  cells: Array<{ column: number; row: number }>;
  height: number;
  glyph: string;
  width: number;
};

type InkBounds = { height: number; maxX: number; maxY: number; minX: number; minY: number; width: number };

function renderAndMeasureGlyph(context: CanvasRenderingContext2D, glyph: string, fontSize: number): InkBounds | null {
  const { offscreenSize } = BRAVURA_BRIDGE_CANVAS_CONFIG.sampling;
  context.canvas.width = offscreenSize;
  context.canvas.height = offscreenSize;
  context.clearRect(0, 0, offscreenSize, offscreenSize);
  context.font = `${fontSize}px "Bravura"`;
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
  const { offscreenSize } = BRAVURA_BRIDGE_CANVAS_CONFIG.sampling;
  const { minStrokeThreshold } = BRAVURA_BRIDGE_CANVAS_CONFIG;
  const bounds = renderAndMeasureGlyph(context, glyph, fontSize);

  if (!bounds) {
    console.error("Bravura bitmap sampling produced no ink", { glyph });
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
    const strongest = candidates.reduce<{ column: number; row: number; coverage: number } | null>((best, candidate) => {
      const coverage = coverageGrid[candidate.row][candidate.column];
      return !best || coverage > best.coverage ? { ...candidate, coverage } : best;
    }, null);

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

  return { cells: [...activeCells].map((key) => {
    const [column, row] = key.split(":").map(Number);
    return { column, row };
  }), glyph, height, width };
}

async function loadBravuraFont() {
  const font = '96px "Bravura"';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await document.fonts.load(font);
    } catch (error) {
      console.warn("Bravura font load attempt failed", { attempt, error });
      continue;
    }

    if (document.fonts.check(font)) {
      console.info("Bravura font diagnostics", { attempt, documentFontsCheck: true, requestedFont: font });
      return true;
    }
  }

  console.error("Bravura font diagnostics: font unavailable; sampling aborted", { requestedFont: font });
  return false;
}

function buildGlyphBitmaps(
  cache: Map<string, GlyphBitmap>,
  controls: Pick<BravuraBridgeControls, "cellSize" | "coverageThreshold" | "glyphScale" | "microDotSize">,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    console.error("Bravura bitmap sampling aborted: offscreen context unavailable");
    return [];
  }

  const { fontSize } = BRAVURA_BRIDGE_CANVAS_CONFIG.sampling;
  const referenceBounds = renderAndMeasureGlyph(context, "\uE0A2", fontSize);

  if (!referenceBounds) {
    console.error("Bravura bitmap sampling aborted: notehead reference unavailable");
    return [];
  }

  const bitmapBudget = Math.max(1, Math.floor((controls.cellSize * controls.glyphScale) / controls.microDotSize));

  return BRAVURA_GLYPH_POOL.active.flatMap((glyph) => {
    const cacheKey = `${glyph}:${bitmapBudget}:${controls.coverageThreshold}`;
    const cachedBitmap = cache.get(cacheKey);

    if (cachedBitmap) {
      return [cachedBitmap];
    }

    const glyphBounds = renderAndMeasureGlyph(context, glyph, fontSize);
    const normalizedFontSize = glyphBounds ? fontSize * (referenceBounds.height / glyphBounds.height) : fontSize;
    const bitmap = sampleGlyphBitmap(
      context,
      glyph,
      normalizedFontSize,
      bitmapBudget,
      controls.coverageThreshold,
    );

    if (bitmap) {
      cache.set(cacheKey, bitmap);
      return [bitmap];
    }

    return [];
  });
}

function buildBridgeCells(metrics: CanvasMetrics, controls: BravuraBridgeControls) {
  const { cellSize, fillProbability, mainSpanSag, sideCableSag } = controls;
  const { edgeDitherRate } = BRAVURA_BRIDGE_CANVAS_CONFIG;
  const columns = Math.ceil(metrics.width / cellSize);
  const rows = Math.ceil(metrics.height / cellSize);
  const cells = new Map<string, BridgeCell>();

  const addCell = (column: number, row: number) => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) {
      return;
    }

    cells.set(getCellKey(column, row), {
      column,
      row,
    });
  };

  const addSquare = (column: number, row: number, radius = 0) => {
    for (let x = column - radius; x <= column + radius; x += 1) {
      for (let y = row - radius; y <= row + radius; y += 1) {
        addCell(x, y);
      }
    }
  };

  const addLine = (fromColumn: number, fromRow: number, toColumn: number, toRow: number, thickness = 0) => {
    const steps = Math.max(Math.abs(toColumn - fromColumn), Math.abs(toRow - fromRow));

    for (let step = 0; step <= steps; step += 1) {
      const progress = steps === 0 ? 0 : step / steps;
      addSquare(
        Math.round(fromColumn + (toColumn - fromColumn) * progress),
        Math.round(fromRow + (toRow - fromRow) * progress),
        thickness,
      );
    }
  };

  const deckRow = Math.round(rows * 0.76);
  const towerTopRow = Math.round(rows * 0.04);
  const towerBottomRow = Math.round(rows * 0.98);
  const leftTower = Math.round(columns * 0.27);
  const rightTower = Math.round(columns * 0.73);
  const towerWidth = Math.max(1, Math.round(columns * 0.0065));
  const towerCrossbeamWidth = towerWidth + 1;
  const towerCrossbeams = [Math.round(rows * 0.29), Math.round(rows * 0.5)];

  addLine(0, deckRow, columns - 1, deckRow, 1);
  addLine(0, deckRow + 2, columns - 1, deckRow + 2);

  for (const tower of [leftTower, rightTower]) {
    addLine(tower - towerWidth, towerTopRow, tower - towerWidth, towerBottomRow);
    addLine(tower + towerWidth, towerTopRow, tower + towerWidth, towerBottomRow);
    addLine(tower - towerWidth, towerTopRow, tower + towerWidth, towerTopRow);

    for (const crossbeamRow of towerCrossbeams) {
      addLine(tower - towerCrossbeamWidth, crossbeamRow, tower + towerCrossbeamWidth, crossbeamRow);
    }
  }

  const getParabolicRow = (fromRow: number, toRow: number, progress: number, sag: number) => {
    return Math.round(fromRow + (toRow - fromRow) * progress + 4 * sag * progress * (1 - progress));
  };
  const mainSpanSagRows = (deckRow - towerTopRow) * mainSpanSag;
  const sideCableSagRows = (deckRow - towerTopRow) * sideCableSag;
  const getCableRow = (column: number) => {
    if (column < leftTower) {
      const progress = (leftTower - column) / leftTower;
      return getParabolicRow(towerTopRow, deckRow, progress, sideCableSagRows);
    }

    if (column > rightTower) {
      const progress = (column - rightTower) / (columns - 1 - rightTower);
      return getParabolicRow(towerTopRow, deckRow, progress, sideCableSagRows);
    }

    const progress = (column - leftTower) / (rightTower - leftTower);
    return getParabolicRow(towerTopRow, towerTopRow, progress, mainSpanSagRows);
  };

  for (let column = 0; column <= columns - 1; column += 0.5) {
    addSquare(Math.round(column), getCableRow(column));
  }

  for (let column = 0; column < columns; column += 3) {
    const cableRow = getCableRow(column);

    if (cableRow < deckRow) {
      addLine(column, cableRow, column, deckRow);
    }
  }

  const retainedCells = new Map<string, BridgeCell>();

  cells.forEach((cell, key) => {
    const isEdgeCell = ![
      getCellKey(cell.column - 1, cell.row),
      getCellKey(cell.column + 1, cell.row),
      getCellKey(cell.column, cell.row - 1),
      getCellKey(cell.column, cell.row + 1),
    ].every((neighbor) => cells.has(neighbor));

    const survivesEdgeDither = !isEdgeCell || getDeterministicValue(cell.column, cell.row) >= edgeDitherRate;
    const isFilled = getDeterministicValue(cell.column, cell.row, 1) < fillProbability;

    if (survivesEdgeDither && isFilled) {
      retainedCells.set(key, cell);
    }
  });

  return retainedCells;
}

function buildRenderedDots(
  cells: Map<string, BridgeCell>,
  glyphBitmaps: GlyphBitmap[],
  cellSize: number,
  microDotSize: number,
) {
  const bitmapsByGlyph = new Map(glyphBitmaps.map((bitmap) => [bitmap.glyph, bitmap]));

  return [...cells.values()].flatMap((cell) => {
    const glyph =
      BRAVURA_GLYPH_POOL.active[
        Math.floor(getDeterministicValue(cell.column, cell.row, 2) * BRAVURA_GLYPH_POOL.active.length)
      ];
    const bitmap = bitmapsByGlyph.get(glyph);

    if (!bitmap) {
      return [];
    }

    const offsetX = (cellSize - bitmap.width * microDotSize) / 2;
    const offsetY = (cellSize - bitmap.height * microDotSize) / 2;

    return bitmap.cells.map(({ column, row }) => ({
      height: microDotSize,
      width: microDotSize,
      x: cell.column * cellSize + offsetX + column * microDotSize,
      y: cell.row * cellSize + offsetY + row * microDotSize,
    }));
  });
}

function drawRenderedDot(context: CanvasRenderingContext2D, dot: RenderedDot) {
  context.fillRect(dot.x, dot.y, dot.width, dot.height);
}

export function BravuraBridgeCanvas() {
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<ActivePointer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bridgeCellsRef = useRef<Map<string, BridgeCell>>(new Map());
  const renderedDotsRef = useRef<RenderedDot[]>([]);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const repaintStaticRef = useRef<() => void>(() => {});
  const controlsRef = useRef<BravuraBridgeControls>(BRAVURA_BRIDGE_CONTROL_DEFAULTS);
  const glyphBitmapCacheRef = useRef<Map<string, GlyphBitmap>>(new Map());
  const [controls, setControls] = useState(BRAVURA_BRIDGE_CONTROL_DEFAULTS);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isFontReady, setIsFontReady] = useState(false);
  const [glyphBitmaps, setGlyphBitmaps] = useState<GlyphBitmap[] | null>(null);
  const { cellSize, coverageThreshold, glyphScale, microDotSize } = controls;

  useEffect(() => {
    let cancelled = false;

    void loadBravuraFont().then((isLoaded) => {
      if (!cancelled && isLoaded) {
        setIsFontReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFontReady) {
      return;
    }

    setGlyphBitmaps(
      buildGlyphBitmaps(glyphBitmapCacheRef.current, {
        cellSize,
        coverageThreshold,
        glyphScale,
        microDotSize,
      }),
    );
  }, [cellSize, coverageThreshold, glyphScale, isFontReady, microDotSize]);

  useEffect(() => {
    controlsRef.current = controls;
    repaintStaticRef.current();
  }, [controls]);

  useEffect(() => {
    const section = staticCanvasRef.current?.closest("section");

    if (!section) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsPanelVisible(entry?.isIntersecting ?? false),
      { threshold: 0.4 },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeCanvas = activeCanvasRef.current;
    const staticCanvas = staticCanvasRef.current;

    if (!activeCanvas || !staticCanvas || !glyphBitmaps) {
      return undefined;
    }

    const activeContext = activeCanvas.getContext("2d");
    const staticContext = staticCanvas.getContext("2d");

    if (!activeContext || !staticContext) {
      return undefined;
    }

    const paintStaticBridge = () => {
      const { idleOpacity } = controlsRef.current;
      const { height, width } = metricsRef.current;
      staticContext.clearRect(0, 0, width, height);
      staticContext.fillStyle = `rgba(249, 244, 241, ${idleOpacity})`;

      renderedDotsRef.current.forEach((dot) => drawRenderedDot(staticContext, dot));
    };
    repaintStaticRef.current = () => {
      bridgeCellsRef.current = buildBridgeCells(metricsRef.current, controlsRef.current);
      renderedDotsRef.current = buildRenderedDots(
        bridgeCellsRef.current,
        glyphBitmaps,
        controlsRef.current.cellSize,
        controlsRef.current.microDotSize,
      );
      activePointerRef.current = null;
      paintStaticBridge();
      activeContext.clearRect(0, 0, metricsRef.current.width, metricsRef.current.height);
    };

    const paintActiveHighlights = (timestamp: number) => {
      const { highlightRadius } = controlsRef.current;
      const { fadeDuration } = BRAVURA_BRIDGE_CANVAS_CONFIG;
      const pointer = activePointerRef.current;
      const { height, width } = metricsRef.current;

      activeContext.clearRect(0, 0, width, height);

      if (!pointer) {
        return false;
      }

      const elapsed = timestamp - pointer.activatedAt;

      if (elapsed >= fadeDuration) {
        activePointerRef.current = null;
        return false;
      }

      const timeIntensity = 1 - elapsed / fadeDuration;

      activeContext.fillStyle = BRAVURA_BRIDGE_CANVAS_CONFIG.highlightColor;
      renderedDotsRef.current.forEach((dot) => {
        const distance = Math.hypot(dot.x + dot.width / 2 - pointer.x, dot.y + dot.height / 2 - pointer.y);

        if (distance > highlightRadius) {
          return;
        }

        activeContext.globalAlpha =
          BRAVURA_BRIDGE_CANVAS_CONFIG.maxHighlightOpacity *
          getFalloff(distance, highlightRadius) *
          timeIntensity *
          timeIntensity;
        drawRenderedDot(activeContext, dot);
      });
      activeContext.globalAlpha = 1;

      return true;
    };

    const requestDrawLoop = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      const animate = (timestamp: number) => {
        if (paintActiveHighlights(timestamp)) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }

        animationFrameRef.current = null;
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      if (!document.fonts.check('96px "Bravura"')) {
        console.error("Bravura font unavailable during resize; cached stamp rendering aborted");
        return;
      }

      const { height, width } = staticCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      metricsRef.current = { dpr, height, width };

      for (const canvas of [staticCanvas, activeCanvas]) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      activeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaintStaticRef.current();
    };

    let resizeTimer: number | null = null;
    const scheduleResize = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        resizeCanvas();
      }, BRAVURA_BRIDGE_CANVAS_CONFIG.resizeDebounceMs);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const bounds = staticCanvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        return;
      }

      activePointerRef.current = { activatedAt: performance.now(), x, y };
      requestDrawLoop();
    };

    const resizeObserver = new ResizeObserver(scheduleResize);

    resizeObserver.observe(staticCanvas);
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("mousemove", handleMouseMove);

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      repaintStaticRef.current = () => {};
    };
  }, [glyphBitmaps]);

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={staticCanvasRef} />
        <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={activeCanvasRef} />
      </div>
      {isPanelVisible
        ? createPortal(
            <BravuraBridgeControlPanel
              controls={controls}
              isMinimized={isPanelMinimized}
              onChange={setControls}
              onToggleMinimized={() => setIsPanelMinimized((isMinimized) => !isMinimized)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

type BravuraBridgeControlPanelProps = {
  controls: BravuraBridgeControls;
  isMinimized: boolean;
  onChange: (controls: BravuraBridgeControls) => void;
  onToggleMinimized: () => void;
};

const CONTROL_PANEL_STYLE = {
  background: "rgba(4, 15, 2, 0.9)",
  border: "1px solid rgba(249, 244, 241, 0.28)",
  borderRadius: "0.375rem",
  color: "#f4e7dd",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "11px",
  lineHeight: 1.3,
  padding: "10px",
  position: "fixed" as const,
  right: "16px",
  top: "16px",
  width: "220px",
  zIndex: 1000,
};

const CONTROL_ROW_STYLE = {
  display: "grid",
  gap: "4px",
  marginTop: "9px",
};

function BravuraBridgeControlPanel({
  controls,
  isMinimized,
  onChange,
  onToggleMinimized,
}: BravuraBridgeControlPanelProps) {
  const updateControl = (key: keyof BravuraBridgeControls, value: string) => {
    onChange({ ...controls, [key]: Number(value) });
  };

  const sliders: Array<{
    key: keyof BravuraBridgeControls;
    label: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: "cellSize", label: "Cell size", min: 4, max: 28, step: 1 },
    { key: "microDotSize", label: "Micro-dot size", min: 1, max: 4, step: 0.25 },
    { key: "glyphScale", label: "Glyph scale", min: 0.5, max: 1.2, step: 0.05 },
    { key: "coverageThreshold", label: "Coverage threshold", min: 0.1, max: 0.5, step: 0.05 },
    { key: "fillProbability", label: "Fill density", min: 0.5, max: 1, step: 0.05 },
    { key: "idleOpacity", label: "Idle opacity", min: 0.15, max: 0.7, step: 0.05 },
    { key: "highlightRadius", label: "Highlight radius", min: 50, max: 300, step: 10 },
  ];

  return (
    <aside aria-label="Bravura Bridge Controls" style={CONTROL_PANEL_STYLE}>
      <div style={{ alignItems: "center", display: "flex", gap: "8px", justifyContent: "space-between" }}>
        <strong style={{ letterSpacing: "0.05em" }}>Bravura Bridge Controls</strong>
        <button
          aria-expanded={!isMinimized}
          aria-label={isMinimized ? "Expand Bravura Bridge Controls" : "Minimize Bravura Bridge Controls"}
          onClick={onToggleMinimized}
          style={{
            background: "transparent",
            border: "1px solid rgba(249, 244, 241, 0.4)",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
            padding: "2px 6px",
          }}
          type="button"
        >
          {isMinimized ? "+" : "−"}
        </button>
      </div>
      {!isMinimized ? (
        <>
          {sliders.map(({ key, label, min, max, step }) => (
            <label key={key} style={CONTROL_ROW_STYLE}>
              <span style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{label}</span>
                <span style={{ color: "#7cff6b" }}>{controls[key]}</span>
              </span>
              <input
                aria-label={label}
                max={max}
                min={min}
                onChange={(event) => updateControl(key, event.target.value)}
                step={step}
                type="range"
                value={controls[key]}
              />
            </label>
          ))}
          <button
            onClick={() => onChange(BRAVURA_BRIDGE_CONTROL_DEFAULTS)}
            style={{
              background: "transparent",
              border: "1px solid rgba(249, 244, 241, 0.4)",
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              marginTop: "10px",
              padding: "5px 8px",
              width: "100%",
            }}
            type="button"
          >
            Reset
          </button>
        </>
      ) : null}
    </aside>
  );
}

export { BRAVURA_BRIDGE_CANVAS_CONFIG };
