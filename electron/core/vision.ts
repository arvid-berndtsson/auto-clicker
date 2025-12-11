import { Region, screen as nutScreen } from '@nut-tree-fork/nut-js';
import { ColorMatch, ScreenRegion } from './types';

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
