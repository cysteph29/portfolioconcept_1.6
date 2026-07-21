"use client";

import { useEffect, useRef } from "react";

const GOLDEN_GATE_CANVAS_CONFIG = {
  cellSize: 8,
  dotFillRatio: 0.25,
  dotSizeJitter: 0.15,
  dotStrokeWidth: 0.75,
  edgeDitherRate: 0.12,
  fadeDuration: 800,
  fillProbability: 0.95,
  highlightRadius: 160,
  idleColor: "rgba(249, 244, 241, 0.24)",
  maxHighlightOpacity: 0.92,
  highlightColor: "#7cff6b",
  mainSpanSag: 0.88,
  resizeDebounceMs: 120,
  sideCableSag: 0.18,
} as const;

type CanvasMetrics = {
  dpr: number;
  height: number;
  width: number;
};

type BridgeCell = {
  column: number;
  dotSize: number;
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

function drawDot(
  context: CanvasRenderingContext2D,
  cell: BridgeCell,
  filled: boolean,
  cellSize: number,
) {
  const x = (cell.column + 0.5) * cellSize - cell.dotSize / 2;
  const y = (cell.row + 0.5) * cellSize - cell.dotSize / 2;

  if (filled) {
    context.fillRect(x, y, cell.dotSize, cell.dotSize);
    return;
  }

  context.strokeRect(x, y, cell.dotSize, cell.dotSize);
}

function buildBridgeCells(metrics: CanvasMetrics) {
  const { cellSize, dotFillRatio, dotSizeJitter, edgeDitherRate, fillProbability } =
    GOLDEN_GATE_CANVAS_CONFIG;
  const columns = Math.ceil(metrics.width / cellSize);
  const rows = Math.ceil(metrics.height / cellSize);
  const cells = new Map<string, BridgeCell>();
  const baseDotSize = cellSize * dotFillRatio;

  const addCell = (column: number, row: number) => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) {
      return;
    }

    const jitter = (getDeterministicValue(column, row, 2) * 2 - 1) * dotSizeJitter;

    cells.set(getCellKey(column, row), {
      column,
      dotSize: baseDotSize * (1 + jitter),
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
  const mainSpanSagRows = (deckRow - towerTopRow) * GOLDEN_GATE_CANVAS_CONFIG.mainSpanSag;
  const sideCableSagRows = (deckRow - towerTopRow) * GOLDEN_GATE_CANVAS_CONFIG.sideCableSag;
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

export function GoldenGateCanvas() {
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<ActivePointer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bridgeCellsRef = useRef<Map<string, BridgeCell>>(new Map());
  const isIntersectingRef = useRef(false);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const repaintStaticRef = useRef<() => void>(() => {});

  useEffect(() => {
    const activeCanvas = activeCanvasRef.current;
    const staticCanvas = staticCanvasRef.current;

    if (!activeCanvas || !staticCanvas) {
      return undefined;
    }

    const activeContext = activeCanvas.getContext("2d");
    const staticContext = staticCanvas.getContext("2d");

    if (!activeContext || !staticContext) {
      return undefined;
    }

    const paintStaticBridge = () => {
      const { cellSize, dotStrokeWidth } = GOLDEN_GATE_CANVAS_CONFIG;
      const { height, width } = metricsRef.current;
      staticContext.clearRect(0, 0, width, height);
      staticContext.lineWidth = dotStrokeWidth / metricsRef.current.dpr;
      staticContext.strokeStyle = GOLDEN_GATE_CANVAS_CONFIG.idleColor;
      staticContext.fillStyle = GOLDEN_GATE_CANVAS_CONFIG.idleColor;

      bridgeCellsRef.current.forEach((cell) => {
        drawDot(staticContext, cell, false, cellSize);
      });
    };
    repaintStaticRef.current = () => {
      bridgeCellsRef.current = buildBridgeCells(metricsRef.current);
      activePointerRef.current = null;
      paintStaticBridge();
      activeContext.clearRect(0, 0, metricsRef.current.width, metricsRef.current.height);
    };

    const paintActiveHighlights = (timestamp: number) => {
      const { cellSize, fadeDuration, highlightRadius } = GOLDEN_GATE_CANVAS_CONFIG;
      const pointer = activePointerRef.current;
      const { height, width } = metricsRef.current;

      activeContext.clearRect(0, 0, width, height);

      if (!pointer || !isIntersectingRef.current) {
        return false;
      }

      const elapsed = timestamp - pointer.activatedAt;

      if (elapsed >= fadeDuration) {
        activePointerRef.current = null;
        return false;
      }

      const radiusInCells = Math.ceil(highlightRadius / cellSize);
      const pointerColumn = Math.floor(pointer.x / cellSize);
      const pointerRow = Math.floor(pointer.y / cellSize);
      const timeIntensity = 1 - elapsed / fadeDuration;

      activeContext.fillStyle = GOLDEN_GATE_CANVAS_CONFIG.highlightColor;
      for (let column = pointerColumn - radiusInCells; column <= pointerColumn + radiusInCells; column += 1) {
        for (let row = pointerRow - radiusInCells; row <= pointerRow + radiusInCells; row += 1) {
          const cell = bridgeCellsRef.current.get(getCellKey(column, row));

          if (!cell) {
            continue;
          }

          const centerX = (column + 0.5) * cellSize;
          const centerY = (row + 0.5) * cellSize;
          const distance = Math.hypot(centerX - pointer.x, centerY - pointer.y);

          if (distance > highlightRadius) {
            continue;
          }

          activeContext.globalAlpha =
            GOLDEN_GATE_CANVAS_CONFIG.maxHighlightOpacity *
            getFalloff(distance, highlightRadius) *
            timeIntensity *
            timeIntensity;
          drawDot(activeContext, cell, true, cellSize);
        }
      }
      activeContext.globalAlpha = 1;

      return true;
    };

    const requestDrawLoop = () => {
      if (animationFrameRef.current !== null || !isIntersectingRef.current) {
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
      }, GOLDEN_GATE_CANVAS_CONFIG.resizeDebounceMs);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isIntersectingRef.current) {
        return;
      }

      const bounds = staticCanvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        return;
      }

      activePointerRef.current = { activatedAt: performance.now(), x, y };
      requestDrawLoop();
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry?.isIntersecting ?? false;

        if (!isIntersectingRef.current) {
          activePointerRef.current = null;
          activeContext.clearRect(0, 0, metricsRef.current.width, metricsRef.current.height);
          return;
        }

        requestDrawLoop();
      },
      { threshold: 0.01 },
    );
    const resizeObserver = new ResizeObserver(scheduleResize);

    intersectionObserver.observe(staticCanvas);
    resizeObserver.observe(staticCanvas);
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    resizeCanvas();

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("mousemove", handleMouseMove);

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      repaintStaticRef.current = () => {};
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={staticCanvasRef} />
      <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={activeCanvasRef} />
    </div>
  );
}

export { GOLDEN_GATE_CANVAS_CONFIG };
