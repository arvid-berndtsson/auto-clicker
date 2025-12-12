import { Region, screen as nutScreen } from '@nut-tree-fork/nut-js';
import * as fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { ColorMatch, ScreenRegion } from './types';

export interface ImageMatchOptions {
  /**
   * Maximum ratio (0-1) of mismatched pixels allowed for a successful detection.
   * Defaults to 0.1 (10%).
   */
  maxDiffRatio?: number;
  /**
   * Pixelmatch threshold (0-1) controlling sensitivity. Lower values demand closer matches.
   * Defaults to 0.1.
   */
  pixelThreshold?: number;
}

export async function captureRegion(region: ScreenRegion): Promise<Buffer> {
  const nutRegion = new Region(region.x, region.y, region.width, region.height);
  const img = await nutScreen.grabRegion(nutRegion);
  return img.data;
}

export async function findColorInRegion(
  region: ScreenRegion,
  color: ColorMatch
): Promise<{ found: boolean; x?: number; y?: number }> {
  const nutRegion = new Region(region.x, region.y, region.width, region.height);
  const img = await nutScreen.grabRegion(nutRegion);

  const pixelData = img.data;
  const width = region.width;
  const height = region.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = pixelData[index];
      const g = pixelData[index + 1];
      const b = pixelData[index + 2];

      if (
        Math.abs(r - color.r) <= color.tolerance &&
        Math.abs(g - color.g) <= color.tolerance &&
        Math.abs(b - color.b) <= color.tolerance
      ) {
        return {
          found: true,
          x: region.x + x,
          y: region.y + y,
        };
      }
    }
  }

  return { found: false };
}

export async function findImageInRegion(
  region: ScreenRegion,
  templatePath: string,
  options: ImageMatchOptions = {}
): Promise<{ found: boolean; x?: number; y?: number; score?: number }> {
  const template = loadTemplate(templatePath);
  const nutRegion = new Region(region.x, region.y, region.width, region.height);
  const screenshot = await nutScreen.grabRegion(nutRegion);

  const regionWidth = screenshot.width;
  const regionHeight = screenshot.height;

  if (
    !regionWidth ||
    !regionHeight ||
    template.width > regionWidth ||
    template.height > regionHeight
  ) {
    return { found: false };
  }

  const maxDiffRatio = options.maxDiffRatio ?? 0.1;
  const pixelThreshold = options.pixelThreshold ?? 0.1;

  for (let y = 0; y <= regionHeight - template.height; y++) {
    for (let x = 0; x <= regionWidth - template.width; x++) {
      const subImage = extractSubImage(
        screenshot.data,
        regionWidth,
        x,
        y,
        template.width,
        template.height
      );

      const diffPixels = pixelmatch(
        subImage,
        template.data,
        undefined,
        template.width,
        template.height,
        {
          threshold: pixelThreshold,
        }
      );

      const diffRatio = diffPixels / (template.width * template.height);
      if (diffRatio <= maxDiffRatio) {
        return {
          found: true,
          x: region.x + x,
          y: region.y + y,
          score: 1 - diffRatio,
        };
      }
    }
  }

  return { found: false };
}

function loadTemplate(templatePath: string): PNG {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template image not found at ${templatePath}`);
  }
  const buffer = fs.readFileSync(templatePath);
  return PNG.sync.read(buffer);
}

function extractSubImage(
  data: Buffer,
  regionWidth: number,
  startX: number,
  startY: number,
  width: number,
  height: number
): Buffer {
  const result = Buffer.alloc(width * height * 4);

  for (let row = 0; row < height; row++) {
    const sourceStart = ((startY + row) * regionWidth + startX) * 4;
    const sourceEnd = sourceStart + width * 4;
    const targetStart = row * width * 4;
    data.copy(result, targetStart, sourceStart, sourceEnd);
  }

  return result;
}
