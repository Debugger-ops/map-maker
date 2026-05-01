"use client";

import type { Dataset, HoverInfo } from "@/lib/types";
import { stats } from "@/lib/parseData";
import { formatNumber } from "@/lib/format";

interface Props {
  dataset: Dataset | null;
  hover: HoverInfo | null;
  compareDataset?: Dataset | null;
  compareHoverValue?: number | null;
}

export default function InfoPanel({
  dataset,
  hover,
  compareDataset,
  compareHoverValue,
}: Props) {
  if (!dataset) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white/90 px-3 py-2.5 text-xs text-zinc-500 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
          </svg>
          Pick a dataset in the sidebar to begin.
        </div>
      </div>
    );
  }

  const s = stats(dataset.rows);
  const avg = s.count > 0
    ? dataset.rows.reduce((sum, r) => sum + (r.value ?? 0), 0) / s.count
    : 0;

  // Find current hover rank
  const sortedRows = [...dataset.rows]
    .filter((r) => r.value !== null && r.value !== undefined)
    .sort((a, b) => b.value - a.value);
  const hoverRank = hover?.name
    ? sortedRows.findIndex((r) =>
        (r.location ?? r.label ?? "").toLowerCase() === hover.name.toLowerCase()
      ) + 1
    : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      {/* Dataset title */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
            {dataset.name}
          </div>
          {dataset.description && (
            <div className="mt-0.5 truncate text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
              {dataset.description}
            </div>
          )}
        </div>
        {dataset.userProvided && (
          <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            AI
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-[10px]">
        <Stat label="Regions" value={String(s.count)} />
        <Stat label="Min" value={formatNumber(s.min)} />
        <Stat label="Avg" value={formatNumber(Math.round(avg))} />
        <Stat label="Max" value={formatNumber(s.max)} />
      </div>

      {/* Hover info */}
      {hover && (
        <div className="mt-2.5 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 dark:border-indigo-800/40 dark:bg-indigo-950/30">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {hover.name || "—"}
              </div>
              <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                {hover.value !== null && hover.value !== undefined
                  ? `${formatNumber(hover.value)}${hover.unit ? " " + hover.unit : ""}`
                  : "no data"}
              </div>
            </div>
            {hoverRank > 0 && (
              <div className="shrink-0 rounded-md bg-indigo-100 px-1.5 py-1 text-center dark:bg-indigo-900/50">
                <div className="text-[9px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400">rank</div>
                <div className="text-xs font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
                  #{hoverRank}
                </div>
              </div>
            )}
          </div>

          {compareDataset && compareHoverValue !== undefined && (
            <div className="mt-1.5 border-t border-indigo-100 pt-1.5 text-[10px] text-zinc-500 dark:border-indigo-800/40 dark:text-zinc-400">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{compareDataset.name}:</span>{" "}
              {compareHoverValue !== null
                ? `${formatNumber(compareHoverValue)}${compareDataset.unit ? " " + compareDataset.unit : ""}`
                : "no data"}
            </div>
          )}
        </div>
      )}

      {!hover && (
        <div className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
          Hover a region to see its value
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 px-1.5 py-1 dark:bg-zinc-800/60">
      <div className="text-[9px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </div>
      <div className="text-[11px] font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
        {value}
      </div>
    </div>
  );
}
