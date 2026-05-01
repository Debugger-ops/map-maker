// Tiny color-scale helpers (no d3 dependency).
// Each palette is a list of RGB anchor stops; we linearly interpolate.

import type { Palette } from "./types";

type RGB = [number, number, number];

const PALETTES: Record<Palette, RGB[]> = {
  blues: [
    [247, 251, 255],
    [198, 219, 239],
    [107, 174, 214],
    [33, 113, 181],
    [8, 48, 107],
  ],
  reds: [
    [255, 245, 240],
    [252, 187, 161],
    [251, 106, 74],
    [203, 24, 29],
    [103, 0, 13],
  ],
  greens: [
    [247, 252, 245],
    [199, 233, 192],
    [116, 196, 118],
    [35, 139, 69],
    [0, 68, 27],
  ],
  viridis: [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ],
  magma: [
    [0, 0, 4],
    [80, 18, 123],
    [183, 55, 121],
    [251, 135, 97],
    [252, 253, 191],
  ],
  plasma: [
    [13, 8, 135],
    [126, 3, 168],
    [204, 71, 120],
    [248, 149, 64],
    [240, 249, 33],
  ],
  diverging: [
    [33, 102, 172],
    [103, 169, 207],
    [247, 247, 247],
    [239, 138, 98],
    [178, 24, 43],
  ],
};

export const PALETTE_LABELS: Record<Palette, string> = {
  blues: "Blues",
  reds: "Reds",
  greens: "Greens",
  viridis: "Viridis",
  magma: "Magma",
  plasma: "Plasma",
  diverging: "Diverging",
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Sample a palette at `t` in [0,1]. */
export function sample(palette: Palette, t: number): string {
  const stops = PALETTES[palette];
  if (!isFinite(t)) return rgbToCss(stops[0]);
  const clamped = Math.min(1, Math.max(0, t));
  const segs = stops.length - 1;
  const pos = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(pos));
  const local = pos - i;
  const c = lerpRGB(stops[i], stops[i + 1], local);
  return rgbToCss(c);
}

function rgbToCss(c: RGB) {
  return `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
}

/** Return a function that maps a raw value to a color, given min/max. */
export function makeColorFn(
  palette: Palette,
  min: number,
  max: number,
  opts?: { log?: boolean }
) {
  const safeMin = isFinite(min) ? min : 0;
  const safeMax = isFinite(max) && max > safeMin ? max : safeMin + 1;
  const log = !!opts?.log && safeMin > 0;
  const lo = log ? Math.log10(safeMin) : safeMin;
  const hi = log ? Math.log10(safeMax) : safeMax;
  return (v: number | null | undefined): string => {
    if (v === null || v === undefined || !isFinite(v)) return "#d1d5db"; // gray-300
    const x = log && v > 0 ? Math.log10(v) : v;
    const t = hi === lo ? 0.5 : (x - lo) / (hi - lo);
    return sample(palette, t);
  };
}

/** Build N evenly spaced legend stops between min and max. */
export function legendStops(min: number, max: number, n = 5): number[] {
  if (!isFinite(min) || !isFinite(max) || max === min) {
    return [min];
  }
  const stops: number[] = [];
  for (let i = 0; i < n; i++) {
    stops.push(min + ((max - min) * i) / (n - 1));
  }
  return stops;
}
