"use client";

import { useEffect, useRef } from "react";

const FOOTER_GRID_CANVAS_CONFIG = {
  cellSize: 10,
  crosshairSize: 3,
  gridColor: "rgba(249, 244, 241, 0.08)",
  crosshairColor: "rgba(249, 244, 241, 0.24)",
  activeColor: "#7cff6b",
  activeMaxOpacity: 0.18,
  fadeDuration: 800,
  glowSpread: 30,
  maxTrailSamples: 18,
  trailOpacityScale: 0.38,
  trailSampleMinDistance: 10,
} as const;

type CanvasBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type CanvasMetrics = {
  dpr: number;
  height: number;
  width: number;
};

type ActivePointer = {
  activatedAt: number;
  x: number;
  y: number;
};

type DirtyRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function getAlignedCoordinate(value: number, dpr: number) {
  return Math.round(value * dpr) / dpr + 0.5 / dpr;
}

function getSquareFalloff(distance: number, spread: number) {
  const linearFalloff = Math.max(0, 1 - distance / spread);

  return linearFalloff * linearFalloff * (3 - 2 * linearFalloff);
}

function drawCrosshair(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dpr: number,
) {
  const alignedX = getAlignedCoordinate(x, dpr);
  const alignedY = getAlignedCoordinate(y, dpr);

  context.moveTo(alignedX - size, alignedY);
  context.lineTo(alignedX + size, alignedY);
  context.moveTo(alignedX, alignedY - size);
  context.lineTo(alignedX, alignedY + size);
}

function getDirtyRect(pointer: ActivePointer, metrics: CanvasMetrics) {
  const { cellSize, crosshairSize, glowSpread } = FOOTER_GRID_CANVAS_CONFIG;
  const padding = glowSpread + cellSize + crosshairSize + 2;
  const x = Math.max(pointer.x - padding, 0);
  const y = Math.max(pointer.y - padding, 0);
  const right = Math.min(pointer.x + padding, metrics.width);
  const bottom = Math.min(pointer.y + padding, metrics.height);

  return {
    height: bottom - y,
    width: right - x,
    x,
    y,
  };
}

function drawStaticGrid(context: CanvasRenderingContext2D, metrics: CanvasMetrics) {
  const { cellSize, crosshairColor, crosshairSize, gridColor } = FOOTER_GRID_CANVAS_CONFIG;
  const { dpr, height, width } = metrics;

  context.clearRect(0, 0, width, height);
  context.lineCap = "square";
  context.lineWidth = 1 / dpr;

  context.beginPath();
  for (let x = 0; x <= width; x += cellSize) {
    const alignedX = getAlignedCoordinate(x, dpr);
    context.moveTo(alignedX, 0);
    context.lineTo(alignedX, height);
  }
  for (let y = 0; y <= height; y += cellSize) {
    const alignedY = getAlignedCoordinate(y, dpr);
    context.moveTo(0, alignedY);
    context.lineTo(width, alignedY);
  }
  context.strokeStyle = gridColor;
  context.stroke();

  context.beginPath();
  for (let x = 0; x <= width; x += cellSize * 4) {
    for (let y = 0; y <= height; y += cellSize * 4) {
      drawCrosshair(context, x, y, crosshairSize, dpr);
    }
  }
  context.strokeStyle = crosshairColor;
  context.stroke();
}

function FooterGridCanvas() {
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<ActivePointer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const boundsRef = useRef<CanvasBounds>({ height: 0, left: 0, top: 0, width: 0 });
  const lastDirtyRectsRef = useRef<DirtyRect[]>([]);
  const metricsRef = useRef<CanvasMetrics>({ dpr: 1, height: 0, width: 0 });
  const trailSamplesRef = useRef<ActivePointer[]>([]);

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

    const {
      activeColor,
      activeMaxOpacity,
      cellSize,
      crosshairSize,
      fadeDuration,
      glowSpread,
      maxTrailSamples,
      trailOpacityScale,
      trailSampleMinDistance,
    } = FOOTER_GRID_CANVAS_CONFIG;

    const clearDirtyRects = (dirtyRects: DirtyRect[]) => {
      for (const dirtyRect of dirtyRects) {
        activeContext.clearRect(dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height);
      }
    };

    const drawActiveHighlights = (pointer: ActivePointer, timestamp: number, opacityScale: number) => {
      const metrics = metricsRef.current;
      const { dpr, height, width } = metrics;
      const elapsed = timestamp - pointer.activatedAt;

      if (elapsed >= fadeDuration) {
        return false;
      }

      const gridX = Math.floor(pointer.x / cellSize);
      const gridY = Math.floor(pointer.y / cellSize);
      const spreadInCells = Math.ceil(glowSpread / cellSize);
      const timeIntensity = 1 - elapsed / fadeDuration;

      activeContext.save();
      activeContext.strokeStyle = activeColor;
      activeContext.lineCap = "square";
      activeContext.lineWidth = 1.25;

      for (let column = gridX - spreadInCells; column <= gridX + spreadInCells; column += 1) {
        for (let row = gridY - spreadInCells; row <= gridY + spreadInCells; row += 1) {
          const centerX = (column + 0.5) * cellSize;
          const centerY = (row + 0.5) * cellSize;
          const squareDistance = Math.max(Math.abs(centerX - pointer.x), Math.abs(centerY - pointer.y));

          if (
            column < 0 ||
            row < 0 ||
            centerX > width + cellSize ||
            centerY > height + cellSize ||
            squareDistance > glowSpread
          ) {
            continue;
          }

          const alpha =
            activeMaxOpacity * opacityScale * getSquareFalloff(squareDistance, glowSpread) * timeIntensity * timeIntensity;
          const xStart = Math.max(column * cellSize, 0);
          const xEnd = Math.min(xStart + cellSize, width);
          const yStart = Math.max(row * cellSize, 0);
          const yEnd = Math.min(yStart + cellSize, height);
          const leftX = getAlignedCoordinate(column * cellSize, dpr);
          const rightX = getAlignedCoordinate((column + 1) * cellSize, dpr);
          const topY = getAlignedCoordinate(row * cellSize, dpr);
          const bottomY = getAlignedCoordinate((row + 1) * cellSize, dpr);

          activeContext.globalAlpha = alpha;
          activeContext.beginPath();
          activeContext.moveTo(leftX, yStart);
          activeContext.lineTo(leftX, yEnd);
          activeContext.moveTo(rightX, yStart);
          activeContext.lineTo(rightX, yEnd);
          activeContext.moveTo(xStart, topY);
          activeContext.lineTo(xEnd, topY);
          activeContext.moveTo(xStart, bottomY);
          activeContext.lineTo(xEnd, bottomY);
          activeContext.stroke();
        }
      }

      const nearestCrossColumn = Math.round(gridX / 4) * 4;
      const nearestCrossRow = Math.round(gridY / 4) * 4;
      const crossSearchSpan = Math.ceil(spreadInCells / 4) * 4;

      for (let column = nearestCrossColumn - crossSearchSpan; column <= nearestCrossColumn + crossSearchSpan; column += 4) {
        for (let row = nearestCrossRow - crossSearchSpan; row <= nearestCrossRow + crossSearchSpan; row += 4) {
          const crossX = column * cellSize;
          const crossY = row * cellSize;
          const squareDistance = Math.max(Math.abs(crossX - pointer.x), Math.abs(crossY - pointer.y));

          if (
            column < 0 ||
            row < 0 ||
            crossX > width ||
            crossY > height ||
            squareDistance > glowSpread
          ) {
            continue;
          }

          activeContext.globalAlpha =
            activeMaxOpacity * opacityScale * getSquareFalloff(squareDistance, glowSpread) * timeIntensity;
          activeContext.beginPath();
          drawCrosshair(activeContext, crossX, crossY, crosshairSize + 1, dpr);
          activeContext.stroke();
        }
      }

      activeContext.restore();

      return true;
    };

    const paintActiveFrame = (timestamp: number) => {
      const pointer = activePointerRef.current;
      const nextDirtyRects: DirtyRect[] = [];

      clearDirtyRects(lastDirtyRectsRef.current);

      trailSamplesRef.current = trailSamplesRef.current.filter((sample) => timestamp - sample.activatedAt < fadeDuration);

      if (pointer && timestamp - pointer.activatedAt >= fadeDuration) {
        activePointerRef.current = null;
      }

      for (const sample of trailSamplesRef.current) {
        nextDirtyRects.push(getDirtyRect(sample, metricsRef.current));
        drawActiveHighlights(sample, timestamp, trailOpacityScale);
      }

      if (activePointerRef.current) {
        nextDirtyRects.push(getDirtyRect(activePointerRef.current, metricsRef.current));
        drawActiveHighlights(activePointerRef.current, timestamp, 1);
      }

      lastDirtyRectsRef.current = nextDirtyRects;

      if (nextDirtyRects.length === 0) {
        return false;
      }

      return true;
    };

    const requestDrawLoop = () => {
      if (animationFrameRef.current !== null) {
        return;
      }

      const animate = (timestamp: number) => {
        if (paintActiveFrame(timestamp)) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }

        animationFrameRef.current = null;
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      const { height, left, top, width } = staticCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nativeWidth = Math.round(width * dpr);
      const nativeHeight = Math.round(height * dpr);

      boundsRef.current = {
        height,
        left: left + window.scrollX,
        top: top + window.scrollY,
        width,
      };
      metricsRef.current = { dpr, height, width };

      for (const canvas of [staticCanvas, activeCanvas]) {
        canvas.width = nativeWidth;
        canvas.height = nativeHeight;
      }

      staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      activeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDirtyRectsRef.current = [];
      trailSamplesRef.current = [];
      drawStaticGrid(staticContext, metricsRef.current);
      activeContext.clearRect(0, 0, width, height);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const { height, left, top, width } = boundsRef.current;
      const x = event.pageX - left;
      const y = event.pageY - top;

      if (x < 0 || y < 0 || x > width || y > height) {
        return;
      }

      const timestamp = performance.now();
      const currentPointer = activePointerRef.current;
      const latestTrailSample = trailSamplesRef.current.at(-1);

      if (
        currentPointer &&
        (!latestTrailSample ||
          Math.max(Math.abs(currentPointer.x - latestTrailSample.x), Math.abs(currentPointer.y - latestTrailSample.y)) >=
            trailSampleMinDistance)
      ) {
        trailSamplesRef.current.push({ activatedAt: timestamp, x: currentPointer.x, y: currentPointer.y });

        if (trailSamplesRef.current.length > maxTrailSamples) {
          trailSamplesRef.current = trailSamplesRef.current.slice(-maxTrailSamples);
        }
      }

      activePointerRef.current = { activatedAt: timestamp, x, y };
      requestDrawLoop();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(staticCanvas);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="contact-footer__grid-canvas" aria-hidden="true">
      <canvas ref={staticCanvasRef} />
      <canvas ref={activeCanvasRef} />
    </div>
  );
}

export { FooterGridCanvas };
