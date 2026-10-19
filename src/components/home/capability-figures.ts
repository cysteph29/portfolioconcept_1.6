export type CapabilityFigureId = "interference" | "completion" | "specimen" | "case" | "seam";

export type FigureTone = "faint" | "mid" | "full" | "lime";

export type FigureCell = {
  column: number;
  row: number;
  tone: FigureTone;
  /** 0 picks the lightest glyphs in the pool, 1 the heaviest. Omitted picks any glyph. */
  weight?: number;
  /** Draw this pool glyph instead of a weight-based pick. */
  glyph?: string;
  /** Square block of cells drawn as one larger glyph, anchored at the top-left cell. */
  span?: number;
};

export type FigureGrid = {
  columns: number;
  rows: number;
};

export type GlyphMask = {
  cells: Array<{ column: number; row: number }>;
  height: number;
  width: number;
};

export type FigureTools = {
  /** `fit: "height"` makes `budget` the mask height, so a wide word stays the requested size. */
  glyphMask: (glyph: string, budget: number, fit?: "max" | "height") => GlyphMask | null;
};

export const SPECIMEN_GLYPH = "ഴ";

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function getCellKey(column: number, row: number) {
  return `${column}:${row}`;
}

function getDeterministicValue(column: number, row: number, seed = 0) {
  const value = Math.sin(column * 12.9898 + row * 78.233 + seed * 37.719) * 43758.5453;

  return value - Math.floor(value);
}

function passesDither(column: number, row: number, density: number) {
  return (BAYER_4[row & 3][column & 3] + 0.5) / 16 < density;
}

function createCellSet({ columns, rows }: FigureGrid) {
  const cells = new Map<string, FigureCell>();

  return {
    cells,
    remove: (column: number, row: number) => cells.delete(getCellKey(column, row)),
    set: (cell: FigureCell) => {
      if (cell.column < 0 || cell.row < 0 || cell.column >= columns || cell.row >= rows) {
        return;
      }

      cells.set(getCellKey(cell.column, cell.row), cell);
    },
  };
}

function buildInterferenceCells(grid: FigureGrid) {
  const { columns, rows } = grid;
  const size = Math.min(columns, rows);
  const { set, cells, remove } = createCellSet(grid);
  const period = 4;
  const sources = [
    { column: size * 0.4, row: size * 0.38, radius: size * 0.44 },
    { column: size * 0.7, row: size * 0.7, radius: size * 0.34 },
  ];
  const midpoint = {
    column: (sources[0].column + sources[1].column) / 2,
    row: (sources[0].row + sources[1].row) / 2,
  };

  const ringAt = (source: (typeof sources)[number], column: number, row: number) => {
    const distance = Math.hypot(column - source.column, row - source.row);

    if (distance > source.radius) {
      return null;
    }

    return Math.cos((2 * Math.PI * distance) / period) > -0.15;
  };

  let focal: { column: number; row: number; distance: number } | null = null;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = ringAt(sources[0], column, row);
      const b = ringAt(sources[1], column, row);

      if (a === null && b === null) {
        continue;
      }

      if (a && b) {
        set({ column, row, tone: "full", weight: 1 });

        const distance = Math.hypot(column - midpoint.column, row - midpoint.row);

        if (!focal || distance < focal.distance) {
          focal = { column, row, distance };
        }
      } else if (a || b) {
        const overlap = a !== null && b !== null;

        set({ column, row, tone: overlap ? "mid" : "faint", weight: overlap ? 0.5 : 0.2 });
      }
    }
  }

  if (focal) {
    for (let row = focal.row - 1; row <= focal.row + 2; row += 1) {
      for (let column = focal.column - 1; column <= focal.column + 2; column += 1) {
        remove(column, row);
      }
    }

    set({ column: focal.column, row: focal.row, span: 2, tone: "lime", weight: 1 });
  }

  return cells;
}

function buildSpecimenCells(grid: FigureGrid, tools: FigureTools) {
  const { columns, rows } = grid;
  const size = Math.min(columns, rows);
  const { set, cells } = createCellSet(grid);
  const mask = tools.glyphMask(SPECIMEN_GLYPH, Math.round(size * 0.74));

  if (!mask) {
    return cells;
  }

  const offsetColumn = -Math.round(size * 0.1);
  const offsetRow = Math.round(size * 0.2);
  const letter = new Set<string>();

  for (const { column, row } of mask.cells) {
    letter.add(getCellKey(column + offsetColumn, row + offsetRow));
  }

  const isLetter = (column: number, row: number) => letter.has(getCellKey(column, row));
  const nearLetter = (column: number, row: number) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (isLetter(column + dx, row + dy)) {
          return true;
        }
      }
    }

    return false;
  };

  const letterRuns = (row: number) => {
    const runs: number[][] = [];

    for (let column = 0; column < columns; column += 1) {
      if (!isLetter(column, row)) {
        continue;
      }

      const last = runs.at(-1);

      if (last && last.at(-1) === column - 1) {
        last.push(column);
      } else {
        runs.push([column]);
      }
    }

    return runs;
  };

  // The baseline sits where ഴ narrows to its single stem, between the bowl and the swash.
  let baselineRow = offsetRow + Math.round(mask.height * 0.6);
  let stem: number[] = [];

  for (let row = offsetRow + Math.round(mask.height * 0.4); row < offsetRow + mask.height; row += 1) {
    const runs = letterRuns(row);

    if (runs.length === 1 && runs[0].length <= 4) {
      baselineRow = row;
      stem = runs[0];
      break;
    }
  }

  const guideRows = [offsetRow - 1, baselineRow, offsetRow + mask.height];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (isLetter(column, row)) {
        set({ column, row, tone: "full", weight: 0.85 });
        continue;
      }

      if (nearLetter(column, row)) {
        continue;
      }

      if (guideRows.includes(row)) {
        set({ column, row, tone: "faint", weight: 0.2 });
      } else if (column % 4 === columns % 4 && passesDither(column, row, 0.5)) {
        set({ column, row, tone: "faint", weight: 0 });
      }
    }
  }

  for (const column of stem) {
    set({ column, row: baselineRow, tone: "lime", weight: 1 });
  }

  return cells;
}

function maskFittedToWidth(tools: FigureTools, glyph: string, targetWidth: number) {
  const probe = tools.glyphMask(glyph, 16, "height");

  if (!probe || probe.width === 0) {
    return null;
  }

  const height = Math.max(8, Math.round((probe.height * targetWidth) / probe.width));

  return tools.glyphMask(glyph, height, "height");
}

function findSplitColumn(mask: GlyphMask) {
  const counts = Array<number>(mask.width).fill(0);

  for (const cell of mask.cells) {
    counts[cell.column] += 1;
  }

  const lightest = Math.min(...counts);
  const gaps: number[][] = [];
  let run: number[] = [];

  for (let column = 0; column < mask.width; column += 1) {
    if (counts[column] === lightest) {
      run.push(column);
    } else if (run.length > 0) {
      gaps.push(run);
      run = [];
    }
  }

  if (run.length > 0) {
    gaps.push(run);
  }

  const interior = gaps.filter((gap) => gap[0] > 0 && gap.at(-1)! < mask.width - 1);
  const candidates = interior.length > 0 ? interior : gaps;
  const middle = (mask.width - 1) / 2;
  let best = candidates[0] ?? [Math.floor(mask.width / 2)];
  let bestDistance = Infinity;

  for (const gap of candidates) {
    const center = (gap[0] + gap.at(-1)!) / 2;
    const distance = Math.abs(center - middle);

    if (distance < bestDistance) {
      best = gap;
      bestDistance = distance;
    }
  }

  return best[Math.floor(best.length / 2)];
}

function buildCompletionCells(grid: FigureGrid, tools: FigureTools) {
  const { columns } = grid;
  const size = Math.min(columns, grid.rows);
  const { set, cells } = createCellSet(grid);
  const mask = maskFittedToWidth(tools, "ലിപി", Math.round(size * 1.12));

  const buildContextLine = (row: number, endColumn: number) => {
    let column = 0;

    while (column < endColumn) {
      const remaining = endColumn - column;

      if (remaining < 2) {
        break;
      }

      const length = Math.min(remaining, 2 + Math.floor(getDeterministicValue(column, row, 5) * 5));

      for (let index = 0; index < length; index += 1) {
        set({ column: column + index, row, tone: "faint", weight: 0.3 });
      }

      column += length + 1;
    }
  };

  buildContextLine(Math.round(size * 0.1), Math.round(size * 0.7));
  buildContextLine(Math.round(size * 0.16), Math.round(size * 0.4));

  if (!mask) {
    return cells;
  }

  const split = Math.round(size * 0.45);
  const offsetColumn = split - findSplitColumn(mask);
  const offsetRow = Math.round(size * 0.3);

  for (const cell of mask.cells) {
    const column = cell.column + offsetColumn;
    const row = cell.row + offsetRow;

    if (Math.abs(column - split) <= 1) {
      continue;
    }

    const committed = column < split;

    set({
      column,
      row,
      tone: committed ? "full" : "mid",
      weight: 0.85,
    });
  }

  for (let row = offsetRow - 1; row <= offsetRow + mask.height - 1; row += 1) {
    set({ column: split, row, tone: "lime", weight: 1 });
  }

  return cells;
}

type CaseBox = {
  c0: number;
  c1: number;
  r0: number;
  r1: number;
};

type CaseSort =
  | { kind: "mask"; glyph: string; budget: number; tone: FigureTone; weight: number }
  | { kind: "glyph"; glyph: string; span: number; tone: FigureTone; weight: number }
  | { kind: "empty" };

const CASE_LAYOUT: Array<CaseBox & { sort: CaseSort }> = [
  { c0: 3, c1: 20, r0: 3, r1: 20, sort: { kind: "mask", glyph: "മ", budget: 14, tone: "full", weight: 0.85 } },
  { c0: 22, c1: 30, r0: 3, r1: 9, sort: { kind: "glyph", glyph: "ക", span: 4, tone: "mid", weight: 0.6 } },
  { c0: 22, c1: 30, r0: 11, r1: 15, sort: { kind: "glyph", glyph: "ര", span: 3, tone: "mid", weight: 0.6 } },
  { c0: 22, c1: 25, r0: 17, r1: 20, sort: { kind: "glyph", glyph: "വ", span: 3, tone: "mid", weight: 0.6 } },
  { c0: 27, c1: 30, r0: 17, r1: 20, sort: { kind: "empty" } },
  { c0: 3, c1: 10, r0: 22, r1: 30, sort: { kind: "glyph", glyph: "യ", span: 4, tone: "mid", weight: 0.6 } },
  { c0: 12, c1: 14, r0: 22, r1: 24, sort: { kind: "glyph", glyph: "അ", span: 2, tone: "lime", weight: 1 } },
  { c0: 12, c1: 14, r0: 26, r1: 30, sort: { kind: "empty" } },
  { c0: 16, c1: 25, r0: 22, r1: 25, sort: { kind: "glyph", glyph: "ല", span: 2, tone: "mid", weight: 0.6 } },
  { c0: 16, c1: 25, r0: 27, r1: 30, sort: { kind: "glyph", glyph: "സ", span: 2, tone: "mid", weight: 0.6 } },
  { c0: 27, c1: 30, r0: 22, r1: 30, sort: { kind: "empty" } },
];

function buildCaseCells(grid: FigureGrid, tools: FigureTools) {
  const size = Math.min(grid.columns, grid.rows);
  const { set, cells } = createCellSet(grid);
  const scale = (value: number) => Math.round((value * size) / 31);
  const boxOf = (box: CaseBox): CaseBox => ({
    c0: scale(box.c0),
    c1: scale(box.c1),
    r0: scale(box.r0),
    r1: scale(box.r1),
  });

  const placeMask = (mask: GlyphMask, box: CaseBox, tone: FigureTone, weight: number) => {
    const offsetColumn = box.c0 + Math.floor((box.c1 - box.c0 + 1 - mask.width) / 2);
    const offsetRow = box.r0 + Math.floor((box.r1 - box.r0 + 1 - mask.height) / 2);

    for (const cell of mask.cells) {
      const column = cell.column + offsetColumn;
      const row = cell.row + offsetRow;

      if (column < box.c0 || column > box.c1 || row < box.r0 || row > box.r1) {
        continue;
      }

      set({ column, row, tone, weight });
    }
  };

  const placeGlyph = (box: CaseBox, glyph: string, span: number, tone: FigureTone, weight: number) => {
    const fitted = Math.min(span, box.c1 - box.c0 + 1, box.r1 - box.r0 + 1);

    if (fitted < 1) {
      return;
    }

    set({
      column: box.c0 + Math.floor((box.c1 - box.c0 + 1 - fitted) / 2),
      row: box.r0 + Math.floor((box.r1 - box.r0 + 1 - fitted) / 2),
      span: fitted,
      glyph,
      tone,
      weight,
    });
  };

  for (const compartment of CASE_LAYOUT) {
    const box = boxOf(compartment);
    const { sort } = compartment;

    if (sort.kind === "mask") {
      const mask = tools.glyphMask(sort.glyph, Math.max(1, scale(sort.budget)), "height");

      if (mask) {
        placeMask(mask, box, sort.tone, sort.weight);
      }
    } else if (sort.kind === "glyph") {
      placeGlyph(box, sort.glyph, Math.max(1, scale(sort.span)), sort.tone, sort.weight);
    }
  }

  const rule = (cell: FigureCell) => set({ ...cell, tone: "faint", weight: 0 });

  const horizontalRule = (row: number, from: number, to: number) => {
    const scaledRow = scale(row);
    const start = scale(from);
    const end = scale(to);

    for (let column = start; column <= end; column += 1) {
      rule({ column, row: scaledRow, tone: "faint" });
    }
  };

  const verticalRule = (column: number, from: number, to: number) => {
    const scaledColumn = scale(column);
    const start = scale(from);
    const end = scale(to);

    for (let row = start; row <= end; row += 1) {
      rule({ column: scaledColumn, row, tone: "faint" });
    }
  };

  horizontalRule(2, 2, 30);
  verticalRule(2, 2, 30);
  horizontalRule(21, 2, 30);
  verticalRule(21, 2, 21);
  horizontalRule(10, 21, 30);
  horizontalRule(16, 21, 30);
  verticalRule(26, 16, 20);
  verticalRule(11, 21, 30);
  verticalRule(15, 21, 30);
  verticalRule(26, 21, 30);
  horizontalRule(25, 11, 15);
  horizontalRule(26, 15, 26);

  return cells;
}

function findCounters(mask: GlyphMask) {
  const ink = new Set(mask.cells.map((cell) => getCellKey(cell.column, cell.row)));
  const seen = new Set<string>();
  const inBounds = (column: number, row: number) =>
    column >= 0 && row >= 0 && column < mask.width && row < mask.height;

  const flood = (startColumn: number, startRow: number, collect: boolean) => {
    const queue = [[startColumn, startRow]];
    const found: Array<{ column: number; row: number }> = [];

    seen.add(getCellKey(startColumn, startRow));

    while (queue.length > 0) {
      const [column, row] = queue.pop()!;

      if (collect) {
        found.push({ column, row });
      }

      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nextColumn = column + dx;
        const nextRow = row + dy;
        const key = getCellKey(nextColumn, nextRow);

        if (!inBounds(nextColumn, nextRow) || ink.has(key) || seen.has(key)) {
          continue;
        }

        seen.add(key);
        queue.push([nextColumn, nextRow]);
      }
    }

    return found;
  };

  for (let column = 0; column < mask.width; column += 1) {
    for (const row of [0, mask.height - 1]) {
      const key = getCellKey(column, row);

      if (!ink.has(key) && !seen.has(key)) {
        flood(column, row, false);
      }
    }
  }

  for (let row = 0; row < mask.height; row += 1) {
    for (const column of [0, mask.width - 1]) {
      const key = getCellKey(column, row);

      if (!ink.has(key) && !seen.has(key)) {
        flood(column, row, false);
      }
    }
  }

  const counters: Array<Array<{ column: number; row: number }>> = [];

  for (let row = 0; row < mask.height; row += 1) {
    for (let column = 0; column < mask.width; column += 1) {
      const key = getCellKey(column, row);

      if (!ink.has(key) && !seen.has(key)) {
        counters.push(flood(column, row, true));
      }
    }
  }

  return counters;
}

function findJunction(mask: GlyphMask) {
  const counts = Array<number>(mask.width).fill(0);

  for (const cell of mask.cells) {
    counts[cell.column] += 1;
  }

  const start = Math.floor(mask.width * 0.25);
  const end = Math.ceil(mask.width * 0.6);
  let junction = Math.floor(mask.width * 0.4);
  let bestScore = -1;

  for (let column = start; column < end; column += 1) {
    const score = counts[column] - (counts[column + 1] ?? 0);

    if (counts[column] >= mask.height * 0.4 && score > bestScore) {
      junction = column;
      bestScore = score;
    }
  }

  return junction;
}

function buildSeamCells(grid: FigureGrid, tools: FigureTools) {
  const { columns, rows } = grid;
  const size = Math.min(columns, rows);
  const { set, cells, remove } = createCellSet(grid);
  const slugEdge = Math.floor(size * 0.5);
  const probe = tools.glyphMask("ണ", 16, "height");
  const junctionRatio = probe && probe.width > 0 ? findJunction(probe) / probe.width : 0.4;
  const roomOnRight = Math.max(8, columns - 1 - slugEdge);
  const targetWidth = Math.min(
    Math.round(size * 0.92),
    Math.floor(roomOnRight / Math.max(0.35, 1 - junctionRatio)),
  );
  const mask = maskFittedToWidth(tools, "ണ", targetWidth);
  const offsetRow = mask ? Math.round((rows - mask.height) / 2) : 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column <= slugEdge; column += 1) {
      set({ column, row, tone: "mid", weight: 0.7 });
    }
  }

  if (!mask) {
    return cells;
  }

  const counters = findCounters(mask);
  // The junction column is the last solid stem cell. Keep it printed, just outside the slug,
  // so the stroke continues across the seam instead of opening a gap.
  let offsetColumn = slugEdge - (findJunction(mask) - 1);

  const portionInside = (offset: number) =>
    counters
      .map((counter) => counter.filter((cell) => cell.column + offset <= slugEdge))
      .filter((counter) => counter.length > 0)
      .sort((a, b) => b.length - a.length)[0];

  const hasInkBeyondSeam = (offset: number) =>
    mask.cells.some((cell) => {
      const column = cell.column + offset;

      return column > slugEdge && column < columns;
    });

  let inside = portionInside(offsetColumn);

  while (!inside && offsetColumn > -mask.width && hasInkBeyondSeam(offsetColumn - 1)) {
    offsetColumn -= 1;
    inside = portionInside(offsetColumn);
  }

  for (const cell of mask.cells) {
    const column = cell.column + offsetColumn;
    const row = cell.row + offsetRow;

    if (column <= slugEdge) {
      remove(column, row);
    } else {
      set({ column, row, tone: "full", weight: 0.85 });
    }
  }

  if (inside) {
    const centerColumn = inside.reduce((sum, cell) => sum + cell.column + offsetColumn, 0) / inside.length;
    const centerRow = inside.reduce((sum, cell) => sum + cell.row + offsetRow, 0) / inside.length;
    const accentColumn = Math.round(centerColumn - 0.5);
    const accentRow = Math.round(centerRow - 0.5);

    for (let row = accentRow; row <= accentRow + 1; row += 1) {
      for (let column = accentColumn; column <= accentColumn + 1; column += 1) {
        remove(column, row);
      }
    }

    set({ column: accentColumn, row: accentRow, span: 2, tone: "lime", weight: 1 });
  }

  return cells;
}

export function buildFigureCells(figure: CapabilityFigureId, grid: FigureGrid, tools: FigureTools) {
  switch (figure) {
    case "interference":
      return buildInterferenceCells(grid);
    case "completion":
      return buildCompletionCells(grid, tools);
    case "specimen":
      return buildSpecimenCells(grid, tools);
    case "case":
      return buildCaseCells(grid, tools);
    case "seam":
      return buildSeamCells(grid, tools);
  }
}

export function getFigureGlyphSeed(column: number, row: number) {
  return getDeterministicValue(column, row, 2);
}
