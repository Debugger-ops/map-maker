"use client";

import { sample, legendStops } from "@/lib/colorScales";
import type { Palette } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface Props {
  palette: Palette;
  min: number;
  max: number;
  unit?: string;
  title?: string;
}

export default function Legend({ palette, min, max, unit, title }: Props) {
  if (!isFinite(min) || !isFinite(max) || min === max) return null;
  const stops = legendStops(min, max, 5);

  // Build CSS gradient from 11 sampled points.
  const gradStops: string[] = [];
  for (let i = 0; i <= 10; i++) {
    gradStops.push(`${sample(palette, i / 10)} ${i * 10}%`);
  }
  const gradient = `linear-gradient(to right, ${gradStops.join(", ")})`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      {title ? (
        <div className="mb-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
          {title}
        </div>
      ) : null}
      <div
        className="h-3 w-full rounded"
        style={{ background: gradient }}
        aria-hidden
      />
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-600 dark:text-zinc-400">
        {stops.map((s, i) => (
          <span key={i}>{formatNumber(s)}</span>
        ))}
      </div>
      {unit ? (
        <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          {unit}
        </div>
      ) : null}
    </div>
  );
}
