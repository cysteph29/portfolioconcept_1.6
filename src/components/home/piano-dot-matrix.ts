type RGB = readonly [number, number, number];

type ColorBlob = {
  color: RGB;
  rx: number;
  ry: number;
  x: number;
  y: number;
};

type BlackColumn = {
  id: string;
  left: number;
  width: number;
};

type ColumnInfo = {
  black: BlackColumn | null;
  whiteId: string;
  whiteIndex: number;
  whiteLeft: number;
  whiteWidth: number;
};

export type PianoDotLayout = {
  blackHeight: number;
  cell: number;
  cols: number;
  columns: readonly ColumnInfo[];
  height: number;
  keyboardHeight: number;
  originX: number;
  originY: number;
  rows: number;
  width: number;
};

const GLYPHS_PER_WHITE_KEY = 7;
/** Share of each cell the glyph's ink box may occupy; the rest is the gap between glyphs. */
const GLYPH_BOX_RATIO = 0.8;
const GLYPH_HEIGHT_RATIO = 0.84;
const GLYPH_FONT_FAMILY = '"Manjari"';
const MALAYALAM_GLYPHS = ["പ", "മ", "യ", "വ", "ല", "സ", "ഗ", "ന"] as const;

const MULTICOLOR_BLOBS = [
  { color: [255, 55, 170], rx: 6.8, ry: 0.38, x: 50.5, y: 0.3 },
  { color: [255, 210, 45], rx: 5.4, ry: 0.34, x: 57, y: 0.58 },
  { color: [255, 125, 35], rx: 6.2, ry: 0.32, x: 63.5, y: 0.24 },
  { color: [40, 215, 245], rx: 7.2, ry: 0.4, x: 69, y: 0.52 },
  { color: [165, 70, 255], rx: 5.8, ry: 0.36, x: 75.5, y: 0.28 },
  { color: [255, 90, 210], rx: 5, ry: 0.3, x: 45, y: 0.48 },
  { color: [70, 160, 255], rx: 6.4, ry: 0.34, x: 82, y: 0.62 },
  { color: [255, 80, 50], rx: 5.6, ry: 0.3, x: 40, y: 0.22 },
  { color: [255, 50, 150], rx: 6.6, ry: 0.36, x: 88.5, y: 0.26 },
  { color: [120, 60, 255], rx: 5.8, ry: 0.32, x: 35, y: 0.66 },
  { color: [255, 200, 40], rx: 5.4, ry: 0.34, x: 94, y: 0.5 },
  { color: [50, 230, 210], rx: 6.2, ry: 0.36, x: 28.5, y: 0.36 },
  { color: [190, 55, 255], rx: 5.8, ry: 0.34, x: 101, y: 0.32 },
  { color: [255, 145, 30], rx: 5, ry: 0.32, x: 22, y: 0.54 },
  { color: [255, 70, 185], rx: 6.4, ry: 0.36, x: 108.5, y: 0.58 },
  { color: [255, 225, 70], rx: 5.4, ry: 0.32, x: 14.5, y: 0.28 },
  { color: [45, 200, 255], rx: 6, ry: 0.34, x: 116, y: 0.4 },
  { color: [255, 240, 200], rx: 4.8, ry: 0.28, x: 61.5, y: 0.78 },
  { color: [255, 70, 120], rx: 5.2, ry: 0.3, x: 66.5, y: 0.42 },
] as const satisfies readonly ColorBlob[];

const QUIET_TONES: readonly RGB[] = [
  [14, 10, 28],
  [10, 20, 22],
  [24, 12, 18],
];

function mix(a: RGB, b: RGB, t: number): RGB {
  const amount = Math.min(1, Math.max(0, t));

  return [
    Math.round(a[0] + (b[0] - a[0]) * amount),
    Math.round(a[1] + (b[1] - a[1]) * amount),
    Math.round(a[2] + (b[2] - a[2]) * amount),
  ];
}

function shadeRgb(rgb: RGB, factor: number): RGB {
  const amount = Math.min(1.2, Math.max(0, factor));

  return [
    Math.min(255, Math.round(rgb[0] * amount)),
    Math.min(255, Math.round(rgb[1] * amount)),
    Math.min(255, Math.round(rgb[2] * amount)),
  ];
}

function fillStyle(rgb: RGB) {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function hash2(ix: number, iy: number) {
  const value = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;

  return value - Math.floor(value);
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);

  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

function blackTone(u: number, v: number) {
  let tone = 2;

  if (v < 0.34) {
    tone = 2;
  } else if (v < 0.72) {
    tone = 3;
  } else {
    tone = 4;
  }

  if (u < 0.18 || v < 0.1) {
    tone = Math.max(0, tone - 2);
  } else if (u < 0.3 || v < 0.2) {
    tone = Math.max(0, tone - 1);
  }

  if (u > 0.84 || v > 0.86) {
    tone = Math.min(4, tone + 1);
  }

  return tone;
}

function blobWeight(kx: number, ky: number, blob: ColorBlob, warpX: number, warpY: number) {
  const dx = (kx + warpX - blob.x) / blob.rx;
  const dy = (ky + warpY - blob.y) / blob.ry;
  const distance = dx * dx + dy * dy;

  if (distance > 4.2) {
    return 0;
  }

  return Math.exp(-distance);
}

function toneFromWeight(weight: number) {
  if (weight < 0.1) {
    return -1;
  }

  if (weight < 0.28) {
    return 0;
  }

  if (weight < 0.52) {
    return 1;
  }

  if (weight < 0.78) {
    return 2;
  }

  return 3;
}

function applyBlobTone(color: RGB, tone: number): RGB {
  if (tone <= 0) {
    return mix(color, [16, 10, 22], 0.64);
  }

  if (tone === 1) {
    return mix(color, [18, 12, 24], 0.3);
  }

  if (tone === 2) {
    return color;
  }

  return mix(color, [255, 245, 230], 0.42);
}

function quietColor(kx: number, ky: number): RGB {
  const sample = valueNoise(kx * 0.07 + 3, ky * 0.5);

  if (sample < 0.33) {
    return QUIET_TONES[0];
  }

  if (sample < 0.66) {
    return QUIET_TONES[1];
  }

  return QUIET_TONES[2];
}

function liftColor(rgb: RGB, amount: number): RGB {
  return mix(rgb, [255, 248, 236], amount);
}

function edgeDarken(rgb: RGB, u: number, isBlack: boolean): RGB {
  const edge = Math.min(u, 1 - u);
  const seam = isBlack ? 0 : u > 0.91;
  let mixAmount = 0;

  if (seam) {
    mixAmount = 0.5;
  } else if (edge < 0.08) {
    mixAmount = 0.42;
  } else if (edge < 0.16) {
    mixAmount = 0.2;
  }

  if (mixAmount === 0) {
    return rgb;
  }

  return mix(rgb, [8, 10, 12], mixAmount);
}

function bandShade(v: number, isBlack: boolean) {
  if (isBlack) {
    if (v < 0.12) {
      return 1.08;
    }

    if (v > 0.82) {
      return 0.82;
    }

    return v < 0.45 ? 1 : 0.9;
  }

  if (v < 0.1) {
    return 1.06;
  }

  if (v < 0.38) {
    return 1;
  }

  if (v < 0.7) {
    return 0.92;
  }

  return 0.84;
}

function multicolorValue(kx: number, ky: number): RGB {
  const warpX = (valueNoise(kx * 0.22, ky * 1.1) - 0.5) * 3.4;
  const warpY = (valueNoise(kx * 0.18 + 12, ky * 1.6) - 0.5) * 0.28;
  let firstWeight = 0;
  let secondWeight = 0;
  let firstBlob: ColorBlob = MULTICOLOR_BLOBS[0];
  let secondBlob: ColorBlob = MULTICOLOR_BLOBS[0];

  for (const blob of MULTICOLOR_BLOBS) {
    const weight = blobWeight(kx, ky, blob, warpX, warpY);

    if (weight > firstWeight) {
      secondWeight = firstWeight;
      secondBlob = firstBlob;
      firstWeight = weight;
      firstBlob = blob;
    } else if (weight > secondWeight) {
      secondWeight = weight;
      secondBlob = blob;
    }
  }

  const tone = toneFromWeight(firstWeight);

  if (tone < 0) {
    return quietColor(kx, ky);
  }

  let color: RGB = firstBlob.color;

  if (secondWeight > firstWeight * 0.55 && firstWeight > 0) {
    const blend = secondWeight / (firstWeight + secondWeight);
    color = mix(firstBlob.color, secondBlob.color, blend * 0.55);
  }

  return applyBlobTone(color, tone);
}

function multicolorDot(
  kx: number,
  ky: number,
  isBlack: boolean,
  u: number,
  v: number,
  active: boolean,
): RGB {
  let color = multicolorValue(kx, ky);

  if (isBlack) {
    color = mix(color, [8, 12, 10], 0.48);
    color = shadeRgb(color, blackTone(u, v) <= 1 ? 1.35 : 0.92);
  }

  color = shadeRgb(color, bandShade(v, isBlack));
  color = edgeDarken(color, u, isBlack);

  if (active) {
    color = liftColor(color, isBlack ? 0.48 : 0.38);
    color = shadeRgb(color, bandShade(v, isBlack));
  }

  return color;
}

export function measurePianoDotLayout(root: HTMLElement, keys: HTMLElement): PianoDotLayout | null {
  const rootRect = root.getBoundingClientRect();
  const keysRect = keys.getBoundingClientRect();
  const width = root.clientWidth;
  const height = root.clientHeight;
  const whiteKeys = keys.querySelectorAll<HTMLElement>("[data-piano-key='white']");
  const blackKeys = keys.querySelectorAll<HTMLElement>("[data-piano-key='black']");

  if (width < 2 || height < 2 || whiteKeys.length === 0 || keysRect.width < 2) {
    return null;
  }

  const whiteWidth = whiteKeys[0].getBoundingClientRect().width;

  if (whiteWidth < 2) {
    return null;
  }

  const cell = whiteWidth / GLYPHS_PER_WHITE_KEY;
  const cols = whiteKeys.length * GLYPHS_PER_WHITE_KEY;
  const rows = Math.max(1, Math.floor(keysRect.height / cell));
  const originX = rootRect.left - keysRect.left;
  const originY = rootRect.top - keysRect.top;
  const blacks: BlackColumn[] = [];
  let blackHeight = height * 0.6;

  for (const key of blackKeys) {
    const note = key.dataset.note;
    const rect = key.getBoundingClientRect();

    if (!note || rect.width < 1) {
      continue;
    }

    blackHeight = rect.height;
    blacks.push({
      id: note,
      left: rect.left - keysRect.left,
      width: rect.width,
    });
  }

  const columns: ColumnInfo[] = [];

  for (let col = 0; col < cols; col += 1) {
    const cx = (col + 0.5) * cell;
    const whiteIndex = Math.min(whiteKeys.length - 1, Math.max(0, Math.floor(cx / whiteWidth)));
    const whiteId = whiteKeys[whiteIndex]?.dataset.note;

    if (!whiteId) {
      continue;
    }

    let black: BlackColumn | null = null;

    for (const candidate of blacks) {
      if (cx >= candidate.left && cx < candidate.left + candidate.width) {
        black = candidate;
        break;
      }
    }

    columns.push({
      black,
      whiteId,
      whiteIndex,
      whiteLeft: whiteIndex * whiteWidth,
      whiteWidth,
    });
  }

  if (columns.length === 0) {
    return null;
  }

  return {
    blackHeight,
    cell,
    cols: columns.length,
    columns,
    height,
    keyboardHeight: keysRect.height,
    originX,
    originY,
    rows,
    width,
  };
}

type GlyphMetric = {
  centerX: number;
  centerY: number;
  height: number;
  width: number;
};

type GlyphCell = {
  col: number;
  cx: number;
  cy: number;
  info: ColumnInfo;
  isBlack: boolean;
  note: string;
  row: number;
  u: number;
  v: number;
};

let glyphFontPromise: Promise<boolean> | null = null;
let glyphFontReady = false;
let glyphMetrics: GlyphMetric[] | null = null;
const glyphSpriteCache = new Map<number, HTMLCanvasElement[]>();

export function loadPianoGlyphFont() {
  if (glyphFontReady) {
    return Promise.resolve(true);
  }

  glyphFontPromise ??= document.fonts
    .load(`32px ${GLYPH_FONT_FAMILY}`, MALAYALAM_GLYPHS.join(""))
    .then(
      (faces) => faces.length > 0,
      () => false,
    )
    .then((loaded) => {
      glyphFontReady = loaded;

      if (!loaded) {
        glyphFontPromise = null;
        console.warn("Manjari font unavailable for the piano glyph treatment");
      }

      return loaded;
    });

  return glyphFontPromise;
}

/** Ink bounds per 1px of font size, measured once after Manjari loads. */
function getGlyphMetrics() {
  if (glyphMetrics) {
    return glyphMetrics;
  }

  const context = document.createElement("canvas").getContext("2d");

  if (!context) {
    return null;
  }

  const size = 100;
  context.font = `${size}px ${GLYPH_FONT_FAMILY}`;
  glyphMetrics = MALAYALAM_GLYPHS.map((glyph) => {
    const metrics = context.measureText(glyph);
    const left = metrics.actualBoundingBoxLeft / size;
    const right = metrics.actualBoundingBoxRight / size;
    const ascent = metrics.actualBoundingBoxAscent / size;
    const descent = metrics.actualBoundingBoxDescent / size;

    return {
      centerX: (right - left) / 2,
      centerY: (descent - ascent) / 2,
      height: ascent + descent,
      width: left + right,
    };
  });

  return glyphMetrics;
}

/**
 * White glyph stamps, one per letter, centered on their ink rather than their advance.
 * Font size is the geometric mean of "match the median height" and "match own height",
 * so short letters grow a little without thickening past their neighbors.
 */
function getGlyphSprites(cellPx: number) {
  const key = Math.round(cellPx * 100) / 100;
  const cached = glyphSpriteCache.get(key);

  if (cached) {
    return cached;
  }

  const metrics = getGlyphMetrics();

  if (!metrics) {
    return null;
  }

  const size = Math.ceil(cellPx);
  const box = cellPx * GLYPH_BOX_RATIO;
  const targetHeight = box * GLYPH_HEIGHT_RATIO;
  const heights = metrics.map((metric) => metric.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)];
  const sprites = MALAYALAM_GLYPHS.map((glyph, index) => {
    const metric = metrics[index];
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context || metric.height <= 0 || metric.width <= 0) {
      return canvas;
    }

    const fontSize = Math.min(
      Math.sqrt((targetHeight / metric.height) * (targetHeight / medianHeight)),
      box / metric.width,
    );

    context.font = `${fontSize}px ${GLYPH_FONT_FAMILY}`;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#fff";
    context.fillText(glyph, size / 2 - metric.centerX * fontSize, size / 2 - metric.centerY * fontSize);

    return canvas;
  });

  glyphSpriteCache.set(key, sprites);

  return sprites;
}

function glyphSeed(col: number, row: number) {
  return Math.floor(hash2(col * 1.7 + 11, row * 2.3 + 5) * MALAYALAM_GLYPHS.length);
}

function glyphIndex(col: number, row: number) {
  const index = glyphSeed(col, row);

  return index === glyphSeed(col - 1, row) ? (index + 1) % MALAYALAM_GLYPHS.length : index;
}

/**
 * Visible glyph cells. White-key seams and the row beneath each black key stay empty
 * so the key silhouettes read as separate shapes.
 */
function forEachGlyphCell(layout: PianoDotLayout, visit: (cell: GlyphCell) => void) {
  const { blackHeight, cell, columns, height, keyboardHeight, originX, originY, rows, width } = layout;
  const firstCol = Math.max(0, Math.floor(originX / cell) - 1);
  const lastCol = Math.min(columns.length - 1, Math.ceil((originX + width) / cell) + 1);
  const firstRow = Math.max(0, Math.floor(originY / cell) - 1);
  const lastRow = Math.min(rows - 1, Math.ceil((originY + height) / cell) + 1);

  for (let col = firstCol; col <= lastCol; col += 1) {
    const info = columns[col];

    if (!info) {
      continue;
    }

    const cx = (col + 0.5) * cell;
    const whiteU = (cx - info.whiteLeft) / info.whiteWidth;

    for (let row = firstRow; row <= lastRow; row += 1) {
      const cy = (row + 0.5) * cell;
      const isBlack = Boolean(info.black) && cy < blackHeight;

      if (!isBlack && (whiteU > 0.9 || (info.black && cy - cell < blackHeight))) {
        continue;
      }

      visit({
        col,
        cx,
        cy,
        info,
        isBlack,
        note: isBlack && info.black ? info.black.id : info.whiteId,
        row,
        u: isBlack && info.black ? (cx - info.black.left) / info.black.width : whiteU,
        v: isBlack ? cy / blackHeight : cy / keyboardHeight,
      });
    }
  }
}

/** Static alpha mask of every glyph stamp. Rebuild only when layout or pixel ratio changes. */
export function buildPianoGlyphMask(layout: PianoDotLayout, dpr: number) {
  if (!glyphFontReady) {
    return null;
  }

  const cellPx = layout.cell * dpr;
  const sprites = getGlyphSprites(cellPx);

  if (!sprites) {
    return null;
  }

  const mask = document.createElement("canvas");
  mask.width = Math.round(layout.width * dpr);
  mask.height = Math.round(layout.height * dpr);
  const context = mask.getContext("2d");

  if (!context) {
    return null;
  }

  const half = Math.ceil(cellPx) / 2;

  forEachGlyphCell(layout, ({ col, cx, cy, row }) => {
    context.drawImage(
      sprites[glyphIndex(col, row)],
      Math.round((cx - layout.originX) * dpr - half),
      Math.round((cy - layout.originY) * dpr - half),
    );
  });

  return mask;
}

export function paintPianoGlyphs(
  context: CanvasRenderingContext2D,
  layout: PianoDotLayout,
  dpr: number,
  mask: HTMLCanvasElement,
  activeNotes: ReadonlySet<string>,
) {
  const { cell, keyboardHeight, originX, originY } = layout;
  const buckets = new Map<string, number[]>();
  const side = Math.ceil(cell * dpr);

  forEachGlyphCell(layout, ({ cx, cy, info, isBlack, note, u, v }) => {
    const fill = fillStyle(
      multicolorDot(cx / info.whiteWidth, cy / keyboardHeight, isBlack, u, v, activeNotes.has(note)),
    );
    let rects = buckets.get(fill);

    if (!rects) {
      rects = [];
      buckets.set(fill, rects);
    }

    rects.push(
      Math.floor((cx - originX - cell / 2) * dpr),
      Math.floor((cy - originY - cell / 2) * dpr),
    );
  });

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (const [fill, rects] of buckets) {
    context.fillStyle = fill;
    context.beginPath();

    for (let index = 0; index < rects.length; index += 2) {
      context.rect(rects[index], rects[index + 1], side, side);
    }

    context.fill();
  }

  context.globalCompositeOperation = "destination-in";
  context.drawImage(mask, 0, 0);
  context.restore();
}
