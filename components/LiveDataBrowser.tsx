"use client";

import { useState } from "react";
import {
  LIVE_INDICATORS,
  INDICATOR_CATEGORIES,
  CATEGORY_EMOJI,
  type IndicatorCategory,
  type LiveIndicator,
} from "@/lib/liveIndicators";
import type { Dataset } from "@/lib/types";

interface Props {
  onDatasetLoaded: (d: Dataset) => void;
}

interface LoadingState {
  indicatorId: string;
  status: "loading" | "done" | "error";
  message?: string;
}

export default function LiveDataBrowser({ onDatasetLoaded }: Props) {
  const [activeCategory, setActiveCategory] = useState<IndicatorCategory>("Economy");
  const [loading, setLoading] = useState<LoadingState | null>(null);
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);

  const visibleIndicators = LIVE_INDICATORS.filter(
    (i) => i.category === activeCategory
  );

  async function loadIndicator(indicator: LiveIndicator) {
    if (loading) return;

    setLoading({ indicatorId: indicator.id, status: "loading" });

    try {
      const res = await fetch(
        `/api/worldbank?indicator=${encodeURIComponent(indicator.id)}&year=${indicator.defaultYear}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Network error" }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        rows?: Array<{ country: string; value: number | null }>;
        year?: string;
        indicatorName?: string;
      };

      if (!data.rows || data.rows.length < 5) {
        throw new Error("Not enough data returned — try a different year or indicator.");
      }

      const rows = data.rows
        .filter((r) => r.value !== null)
        .map((r) => ({ location: r.country, value: r.value as number }));

      const dataset: Dataset = {
        id:            `wb-${indicator.id}-${Date.now()}`,
        name:          `🌍 ${indicator.name}`,
        description:   `${indicator.description} · World Bank Open Data (${data.year ?? indicator.defaultYear})`,
        scope:         "world",
        visualization: "choropleth",
        unit:          indicator.unit,
        rows,
        userProvided:  true,
      };

      onDatasetLoaded(dataset);
      setLastLoaded(indicator.id);
      setLoading({ indicatorId: indicator.id, status: "done" });
      setTimeout(() => setLoading(null), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoading({ indicatorId: indicator.id, status: "error", message: msg });
      setTimeout(() => setLoading(null), 3000);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header note */}
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
          <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
          <strong>Real data</strong> from World Bank Open Data — no API key needed.
          Click any indicator to load it live onto the map.
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {INDICATOR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            }`}
          >
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Indicator list */}
      <div className="space-y-1.5">
        {visibleIndicators.map((ind) => {
          const isLoading  = loading?.indicatorId === ind.id && loading.status === "loading";
          const isDone     = loading?.indicatorId === ind.id && loading.status === "done";
          const isError    = loading?.indicatorId === ind.id && loading.status === "error";
          const wasLoaded  = lastLoaded === ind.id && !loading;

          return (
            <button
              key={ind.id}
              type="button"
              disabled={Boolean(loading)}
              onClick={() => loadIndicator(ind)}
              className={`group flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                wasLoaded
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/30"
                  : isDone
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/30"
                  : isError
                  ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/30"
                  : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-600/50 dark:hover:bg-indigo-950/20"
              } disabled:opacity-60`}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {isLoading ? (
                  <svg className="h-3.5 w-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"/>
                  </svg>
                ) : isDone || wasLoaded ? (
                  <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isError ? (
                  <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-400 dark:text-zinc-600 dark:group-hover:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[12px] font-semibold truncate ${
                    isDone || wasLoaded
                      ? "text-emerald-700 dark:text-emerald-300"
                      : isError
                      ? "text-red-700 dark:text-red-400"
                      : "text-zinc-800 dark:text-zinc-200"
                  }`}>
                    {ind.name}
                  </span>
                  <span className="shrink-0 rounded-full border border-zinc-100 bg-zinc-50 px-1.5 py-px text-[9px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
                    {ind.unit}
                  </span>
                </div>
                {isError ? (
                  <p className="mt-0.5 text-[10px] text-red-600 dark:text-red-400">{loading?.message}</p>
                ) : (
                  <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
                    {ind.description}
                    <span className="ml-1 text-zinc-400 dark:text-zinc-600">· {ind.defaultYear}</span>
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-zinc-400 dark:text-zinc-600">
        Source: World Bank Open Data · data.worldbank.org · Free &amp; open access
      </p>
    </div>
  );
}
