export type CapabilityFigureId = "hard-problems";

export type FigureInk = "cream" | "lime";

export type FigureCell = {
  column: number;
  row: number;
  ink: FigureInk;
};

const HARD_PROBLEMS_DENSITY = {
  creamEdgeDither: 0.08,
  creamFill: 0.88,
  limeEdgeDither: 0,
  limeFill: 1,
} as const;

function getCellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function getDeterministicValue(column: number, row: number, seed = 0) {
  const value = Math.sin(column * 12.9898 + row * 78.233 + seed * 37.719) * 43758.5453;

  return value - Math.floor(value);
}

function rotatePoint(x: number, y: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function fitPoints(
  points: Array<{ x: number; y: number }>,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const point of points) {
    x0 = Math.min(x0, point.x);
    y0 = Math.min(y0, point.y);
    x1 = Math.max(x1, point.x);
    y1 = Math.max(y1, point.y);
  }

  const sourceWidth = x1 - x0 || 1;
  const sourceHeight = y1 - y0 || 1;
  const scale = Math.min((maxX - minX) / sourceWidth, (maxY - minY) / sourceHeight);
  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  const targetX = (minX + maxX) / 2;
  const targetY = (minY + maxY) / 2;

  return points.map((point) => ({
    column: targetX + (point.x - centerX) * scale,
    row: targetY + (point.y - centerY) * scale,
  }));
}

function thinCells(cells: Map<string, FigureCell>) {
  const retained = new Map<string, FigureCell>();

  cells.forEach((cell, key) => {
    const isEdgeCell = ![
      getCellKey(cell.column - 1, cell.row),
      getCellKey(cell.column + 1, cell.row),
      getCellKey(cell.column, cell.row - 1),
      getCellKey(cell.column, cell.row + 1),
    ].every((neighbor) => cells.has(neighbor));
    const ditherRate =
      cell.ink === "lime" ? HARD_PROBLEMS_DENSITY.limeEdgeDither : HARD_PROBLEMS_DENSITY.creamEdgeDither;
    const fillProbability =
      cell.ink === "lime" ? HARD_PROBLEMS_DENSITY.limeFill : HARD_PROBLEMS_DENSITY.creamFill;
    const survivesEdgeDither = !isEdgeCell || getDeterministicValue(cell.column, cell.row) >= ditherRate;
    const isFilled = getDeterministicValue(cell.column, cell.row, 1) < fillProbability;

    if (survivesEdgeDither && isFilled) {
      retained.set(key, cell);
    }
  });

  return retained;
}

function buildHardProblemsCells(width: number, height: number, cellSize: number) {
  const columns = Math.max(1, Math.ceil(width / cellSize));
  const rows = Math.max(1, Math.ceil(height / cellSize));
  const inset = Math.max(2, Math.round(Math.min(columns, rows) * 0.06));
  const deckRow = Math.round(rows * 0.52);
  const knotRight = columns * 0.6;
  const limeStart = columns * 0.52;
  const spanStart = inset;
  const spanEnd = columns - 1 - inset;
  const cells = new Map<string, FigureCell>();

  const addCell = (column: number, row: number, ink: FigureInk) => {
    const nextColumn = Math.round(column);
    const nextRow = Math.round(row);

    if (nextColumn < 0 || nextRow < 0 || nextColumn >= columns || nextRow >= rows) {
      return;
    }

    cells.set(getCellKey(nextColumn, nextRow), {
      column: nextColumn,
      ink,
      row: nextRow,
    });
  };

  const addSquare = (column: number, row: number, radius: number, ink: FigureInk) => {
    for (let x = column - radius; x <= column + radius; x += 1) {
      for (let y = row - radius; y <= row + radius; y += 1) {
        addCell(x, y, ink);
      }
    }
  };

  const addLine = (
    fromColumn: number,
    fromRow: number,
    toColumn: number,
    toRow: number,
    ink: FigureInk,
    thickness = 0,
  ) => {
    const steps = Math.max(
      1,
      Math.round(Math.abs(toColumn - fromColumn)),
      Math.round(Math.abs(toRow - fromRow)),
    );

    for (let step = 0; step <= steps; step += 1) {
      const progress = steps === 0 ? 0 : step / steps;
      addSquare(
        Math.round(fromColumn + (toColumn - fromColumn) * progress),
        Math.round(fromRow + (toRow - fromRow) * progress),
        thickness,
        ink,
      );
    }
  };

  const addPolyline = (points: Array<{ column: number; row: number }>, ink: FigureInk, closed = false) => {
    if (points.length < 2) {
      return;
    }

    const count = closed ? points.length : points.length - 1;

    for (let index = 0; index < count; index += 1) {
      const from = points[index];
      const to = points[(index + 1) % points.length];
      addLine(from.column, from.row, to.column, to.row, ink);
    }
  };

  const addParabola = (
    fromColumn: number,
    fromRow: number,
    toColumn: number,
    toRow: number,
    sagRows: number,
    ink: FigureInk,
  ) => {
    const steps = Math.max(16, Math.abs(toColumn - fromColumn) * 2, Math.abs(toRow - fromRow) * 2);
    const points: Array<{ column: number; row: number }> = [];

    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      points.push({
        column: fromColumn + (toColumn - fromColumn) * progress,
        row: fromRow + (toRow - fromRow) * progress + 4 * sagRows * progress * (1 - progress),
      });
    }

    addPolyline(points, ink);
  };

  const knot: Array<{ x: number; y: number }> = [];

  for (let step = 0; step <= 96; step += 1) {
    const angle = (step / 96) * Math.PI * 2;
    knot.push({
      x: Math.sin(angle),
      y: Math.sin(angle) * Math.cos(angle),
    });
  }

  addPolyline(
    fitPoints(knot, columns * 0.08, knotRight, deckRow - rows * 0.32, deckRow + rows * 0.32),
    "cream",
    true,
  );

  const loop: Array<{ x: number; y: number }> = [];

  for (let step = 0; step <= 72; step += 1) {
    const angle = (step / 72) * Math.PI * 2;
    loop.push(rotatePoint(Math.cos(angle), Math.sin(angle) * 0.58, 0.4));
  }

  addPolyline(
    fitPoints(loop, columns * 0.14, columns * 0.44, deckRow - rows * 0.22, deckRow + rows * 0.28),
    "cream",
    true,
  );

  addParabola(spanStart, deckRow - rows * 0.28, limeStart, deckRow, rows * 0.12, "cream");
  addParabola(spanStart, deckRow + rows * 0.3, limeStart, deckRow, -rows * 0.1, "cream");
  addLine(knotRight - 3, deckRow, limeStart, deckRow, "cream");
  addLine(limeStart, deckRow, spanEnd, deckRow, "lime");
  addLine(limeStart, deckRow - 1, spanEnd, deckRow - 1, "lime");

  return thinCells(cells);
}

export function buildFigureCells(
  figure: CapabilityFigureId,
  width: number,
  height: number,
  cellSize: number,
) {
  switch (figure) {
    case "hard-problems":
      return buildHardProblemsCells(width, height, cellSize);
  }
}

export function getFigureGlyphSeed(column: number, row: number) {
  return getDeterministicValue(column, row, 2);
}
