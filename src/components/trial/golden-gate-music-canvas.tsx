"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GOLDEN_GATE_MUSIC_CANVAS_CONFIG = {
  cellSize: 18,
  edgeDitherRate: 0.12,
  fadeDuration: 800,
  fillProbability: 0.95,
  highlightRadius: 160,
  idleOpacity: 0.38,
  maxHighlightOpacity: 1,
  highlightColor: "#7cff6b",
  mainSpanSag: 0.88,
  resizeDebounceMs: 120,
  sideCableSag: 0.18,
  symbolSet: ["♩", "♪", "♫", "♬"],
  symbolSizeFactor: 0.85,
  densityTiers: {
    sparseMax: 1,
    lowMediumMax: 3,
    mediumDenseMax: 5,
  },
  fontFallback: "Mondwest, sans-serif",
} as const;

type GoldenGateMusicControls = {
  cellSize: number;
  fillProbability: number;
  highlightRadius: number;
  idleOpacity: number;
  mainSpanSag: number;
  sideCableSag: number;
  symbolSizeFactor: number;
  tierSizeContrast: number;
};

const GOLDEN_GATE_MUSIC_CONTROL_DEFAULTS: GoldenGateMusicControls = {
  cellSize: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.cellSize,
  fillProbability: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.fillProbability,
  highlightRadius: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.highlightRadius,
  idleOpacity: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.idleOpacity,
  mainSpanSag: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.mainSpanSag,
  sideCableSag: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.sideCableSag,
  symbolSizeFactor: GOLDEN_GATE_MUSIC_CANVAS_CONFIG.symbolSizeFactor,
  tierSizeContrast: 0,
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

function drawDot(
  context: CanvasRenderingContext2D,
  cell: BridgeCell,
  cellSize: number,
  cells: Map<string, BridgeCell>,
  fontFamily: string,
  symbolSizeFactor: number,
  tierSizeContrast: number,
) {
  const neighbors = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ].reduce((count, [columnOffset, rowOffset]) => {
    return count + (cells.has(getCellKey(cell.column + columnOffset, cell.row + rowOffset)) ? 1 : 0);
  }, 0);
  const { lowMediumMax, mediumDenseMax, sparseMax } = GOLDEN_GATE_MUSIC_CANVAS_CONFIG.densityTiers;
  const tier = neighbors <= sparseMax ? 0 : neighbors <= lowMediumMax ? 1 : neighbors <= mediumDenseMax ? 2 : 3;
  const symbol = GOLDEN_GATE_MUSIC_CANVAS_CONFIG.symbolSet[tier];
  const fontSize = cellSize * symbolSizeFactor * (1 + ((tier - 1.5) * tierSizeContrast) / 1.5);

  context.font = `${fontSize}px ${fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    symbol,
    (cell.column + 0.5) * cellSize,
    (cell.row + 0.5) * cellSize,
  );
}

function getMondwestFontFamily() {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--font-mondwest").trim() ||
    GOLDEN_GATE_MUSIC_CANVAS_CONFIG.fontFallback
  );
}

function buildBridgeCells(metrics: CanvasMetrics, controls: GoldenGateMusicControls) {
  const { cellSize, fillProbability, mainSpanSag, sideCableSag } = controls;
  const { edgeDitherRate } = GOLDEN_GATE_MUSIC_CANVAS_CONFIG;
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

export function GoldenGateMusicCanvas() {
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<ActivePointer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bridgeCellsRef = useRef<Map<string, BridgeCell>>(new Map());
  const isIntersectingRef = useRef(false);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const repaintStaticRef = useRef<() => void>(() => {});
  const controlsRef = useRef<GoldenGateMusicControls>(GOLDEN_GATE_MUSIC_CONTROL_DEFAULTS);
  const [controls, setControls] = useState(GOLDEN_GATE_MUSIC_CONTROL_DEFAULTS);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

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

    if (!activeCanvas || !staticCanvas) {
      return undefined;
    }

    const activeContext = activeCanvas.getContext("2d");
    const staticContext = staticCanvas.getContext("2d");

    if (!activeContext || !staticContext) {
      return undefined;
    }

    const mondwestFontFamily = getMondwestFontFamily();

    const paintStaticBridge = () => {
      const { cellSize, idleOpacity, symbolSizeFactor, tierSizeContrast } = controlsRef.current;
      const { height, width } = metricsRef.current;
      staticContext.clearRect(0, 0, width, height);
      staticContext.fillStyle = `rgba(249, 244, 241, ${idleOpacity})`;

      bridgeCellsRef.current.forEach((cell) => {
        drawDot(
          staticContext,
          cell,
          cellSize,
          bridgeCellsRef.current,
          mondwestFontFamily,
          symbolSizeFactor,
          tierSizeContrast,
        );
      });
    };
    repaintStaticRef.current = () => {
      bridgeCellsRef.current = buildBridgeCells(metricsRef.current, controlsRef.current);
      activePointerRef.current = null;
      paintStaticBridge();
      activeContext.clearRect(0, 0, metricsRef.current.width, metricsRef.current.height);
    };

    const paintActiveHighlights = (timestamp: number) => {
      const { cellSize, highlightRadius, symbolSizeFactor, tierSizeContrast } = controlsRef.current;
      const { fadeDuration } = GOLDEN_GATE_MUSIC_CANVAS_CONFIG;
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

      activeContext.fillStyle = GOLDEN_GATE_MUSIC_CANVAS_CONFIG.highlightColor;
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
            GOLDEN_GATE_MUSIC_CANVAS_CONFIG.maxHighlightOpacity *
            getFalloff(distance, highlightRadius) *
            timeIntensity *
            timeIntensity;
          drawDot(
            activeContext,
            cell,
            cellSize,
            bridgeCellsRef.current,
            mondwestFontFamily,
            symbolSizeFactor,
            tierSizeContrast,
          );
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
      }, GOLDEN_GATE_MUSIC_CANVAS_CONFIG.resizeDebounceMs);
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
    let cancelled = false;

    void Promise.all([
      document.fonts.load(`${GOLDEN_GATE_MUSIC_CANVAS_CONFIG.cellSize}px ${mondwestFontFamily}`),
      document.fonts.ready,
    ])
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) {
          resizeCanvas();
        }
      });

    return () => {
      cancelled = true;
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
    <>
      <div className="absolute inset-0" aria-hidden="true">
        <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={staticCanvasRef} />
        <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={activeCanvasRef} />
      </div>
      {isPanelVisible
        ? createPortal(
            <GoldenGateMusicControlPanel
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

type GoldenGateMusicControlPanelProps = {
  controls: GoldenGateMusicControls;
  isMinimized: boolean;
  onChange: (controls: GoldenGateMusicControls) => void;
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

function GoldenGateMusicControlPanel({
  controls,
  isMinimized,
  onChange,
  onToggleMinimized,
}: GoldenGateMusicControlPanelProps) {
  const updateControl = (key: keyof GoldenGateMusicControls, value: string) => {
    onChange({ ...controls, [key]: Number(value) });
  };

  const sliders: Array<{
    key: keyof GoldenGateMusicControls;
    label: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: "cellSize", label: "Cell size", min: 10, max: 28, step: 1 },
    { key: "symbolSizeFactor", label: "Symbol size", min: 0.5, max: 1.5, step: 0.05 },
    { key: "fillProbability", label: "Fill density", min: 0.5, max: 1, step: 0.05 },
    { key: "idleOpacity", label: "Idle opacity", min: 0.15, max: 0.7, step: 0.05 },
    { key: "tierSizeContrast", label: "Tier size contrast", min: 0, max: 0.5, step: 0.05 },
    { key: "mainSpanSag", label: "Main span sag", min: 0.3, max: 1.1, step: 0.05 },
    { key: "sideCableSag", label: "Side cable sag", min: 0, max: 0.5, step: 0.05 },
    { key: "highlightRadius", label: "Highlight radius", min: 50, max: 300, step: 10 },
  ];

  return (
    <aside aria-label="Music Bridge Controls" style={CONTROL_PANEL_STYLE}>
      <div style={{ alignItems: "center", display: "flex", gap: "8px", justifyContent: "space-between" }}>
        <strong style={{ letterSpacing: "0.05em" }}>Music Bridge Controls</strong>
        <button
          aria-expanded={!isMinimized}
          aria-label={isMinimized ? "Expand Music Bridge Controls" : "Minimize Music Bridge Controls"}
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
            onClick={() => onChange(GOLDEN_GATE_MUSIC_CONTROL_DEFAULTS)}
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

export { GOLDEN_GATE_MUSIC_CANVAS_CONFIG };
