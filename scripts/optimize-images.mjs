import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const SOURCE_DIR = path.resolve(process.argv[2] ?? "./raw-assets");
const OUTPUT_SUBDIR = process.argv[3] ?? "";
const FILE_PREFIX = process.argv[4] ?? "";
const OUTPUT_DIR = path.resolve("./public/work", OUTPUT_SUBDIR);
const MAX_WIDTH = 2400;
const WEBP_QUALITY = 80;
const RASTER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(entryPath);
      }

      if (entry.isFile()) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

async function optimizeRaster(inputPath, relativePath) {
  const extension = path.extname(relativePath);
  const outputRelativePath = path.join(
    path.dirname(relativePath),
    `${path.basename(relativePath, extension)}.webp`,
  );
  const outputPath = path.join(OUTPUT_DIR, outputRelativePath);
  const originalStats = await stat(inputPath);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const outputInfo = await sharp(inputPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);

  console.log(
    `${relativePath} -> ${path.relative(process.cwd(), outputPath)}: ${formatBytes(
      originalStats.size,
    )} -> ${formatBytes(outputInfo.size)} (${outputInfo.width}x${outputInfo.height})`,
  );
}

async function getImageDimensions(inputPath) {
  const metadata = await sharp(inputPath)
    .metadata()
    .catch(() => null);

  if (!metadata?.width || !metadata.height) {
    return "dimensions unavailable";
  }

  return `${metadata.width}x${metadata.height}`;
}

async function copySvg(inputPath, relativePath) {
  const outputPath = path.join(OUTPUT_DIR, relativePath);
  const originalStats = await stat(inputPath);
  const dimensions = await getImageDimensions(inputPath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await copyFile(inputPath, outputPath);

  console.log(
    `${relativePath} -> ${path.relative(process.cwd(), outputPath)}: ${formatBytes(
      originalStats.size,
    )} -> ${formatBytes(originalStats.size)} (${dimensions}, SVG copied unchanged)`,
  );
}

async function main() {
  const sourceStats = await stat(SOURCE_DIR).catch(() => null);

  if (!sourceStats?.isDirectory()) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exitCode = 1;
    return;
  }

  const files = await walkFiles(SOURCE_DIR);

  for (const inputPath of files) {
    const relativePath = path.relative(SOURCE_DIR, inputPath);
    const fileName = path.basename(relativePath);
    const extension = path.extname(inputPath).toLowerCase();

    if (FILE_PREFIX && !fileName.startsWith(FILE_PREFIX)) {
      continue;
    }

    if (RASTER_EXTENSIONS.has(extension)) {
      await optimizeRaster(inputPath, relativePath);
      continue;
    }

    if (extension === ".svg") {
      await copySvg(inputPath, relativePath);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
