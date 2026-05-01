"use client";

import { useEffect, useState, useCallback } from "react";
import type { MapScope } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import type { WeatherData } from "@/app/api/weather/route";

interface Props {
  region: string | null;
  value: number | null;
  unit?: string;
  rank?: number;
  totalRegions?: number;
  scope: MapScope;
  groqKey: string;
  geminiKey: string;
  openAIKey: string;
  serverProvider: "groq" | "gemini" | "openai" | null;
  onClose: () => void;
}

interface AIInsight {
  facts: string[];
  capital?: string;
  population?: string;
  area?: string;
  currency?: string;
  language?: string;
}

interface WikiSummary {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

export default function RegionDetailPanel({
  region,
  value,
  unit,
  rank,
  totalRegions,
  scope,
  groqKey,
  geminiKey,
  openAIKey,
  serverProvider,
  onClose,
}: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [ai, setAI] = useState<AIInsight | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "weather" | "wiki" | "ai">("overview");

  const activeProvider: "groq" | "gemini" | "openai" | null =
    groqKey ? "groq" : geminiKey ? "gemini" : openAIKey ? "openai" : serverProvider;
  const aiReady = Boolean(activeProvider);

  const fetchWeather = useCallback(async (name: string) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?name=${encodeURIComponent(name)}`);
      if (res.ok) setWeather(await res.json());
    } catch (_) {
      // ignore
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchWiki = useCallback(async (name: string) => {
    setWikiLoading(true);
    try {
      const res = await fetch(`/api/wiki?title=${encodeURIComponent(name)}&scope=${scope}`);
      if (res.ok) setWiki(await res.json());
    } catch (_) {
      // ignore
    } finally {
      setWikiLoading(false);
    }
  }, [scope]);

  const fetchAI = useCallback(async (name: string) => {
    if (!aiReady) {
      setAIError("Add your OpenAI API key in ⚙ Settings to enable AI insights.");
      return;
    }
    setAILoading(true);
    setAIError(null);
    try {
      const headers: Record<string, string> = {};
      if      (groqKey)   headers["x-groq-key"]   = groqKey;
      else if (geminiKey) headers["x-gemini-key"] = geminiKey;
      else if (openAIKey) headers["x-openai-key"] = openAIKey;

      const res = await fetch(`/api/ai/describe?region=${encodeURIComponent(name)}&scope=${scope}`, {
        headers,
      });
      if (res.ok) {
        setAI(await res.json());
      } else {
        const d = await res.json();
        setAIError(d.error ?? "AI failed");
      }
    } catch (e) {
      setAIError(String(e));
    } finally {
      setAILoading(false);
    }
  }, [scope, openAIKey, aiReady]);

  useEffect(() => {
    if (!region) return;
    setWeather(null);
    setWiki(null);
    setAI(null);
    setAIError(null);
    setTab("overview");
    fetchWeather(region);
    fetchWiki(region);
  }, [region, fetchWeather, fetchWiki]);

  useEffect(() => {
    if (tab === "ai" && region && !ai && !aiLoading) {
      fetchAI(region);
    }
  }, [tab, region, ai, aiLoading, fetchAI]);

  if (!region) return null;

  const tabs: { id: "overview" | "weather" | "wiki" | "ai"; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "weather",
      label: "Weather",
      icon: (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "wiki",
      label: "Wiki",
      icon: (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "ai",
      label: "AI Facts",
      icon: (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-bold text-zinc-900 dark:text-white">{region}</div>
            {rank && totalRegions && (
              <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                #{rank} of {totalRegions}
              </span>
            )}
          </div>
          {value !== null && (
            <div className="mt-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {formatNumber(value)}{unit ? ` ${unit}` : ""}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 px-1 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition ${
              tab === t.id
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-80 overflow-y-auto p-4 text-xs">
        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-3">
            {/* Value bar */}
            {value !== null && (
              <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div className="text-[10px] uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Dataset value</div>
                <div className="mt-0.5 text-xl font-bold text-indigo-700 dark:text-indigo-300">
                  {formatNumber(value)}{unit ? ` ${unit}` : ""}
                </div>
                {rank && totalRegions && (
                  <div className="mt-1 text-[10px] text-indigo-500/70 dark:text-indigo-400/70">
                    Ranked #{rank} out of {totalRegions} regions
                  </div>
                )}
              </div>
            )}

            {/* Quick weather */}
            {weatherLoading ? (
              <Skeleton />
            ) : weather ? (
              <div className="flex items-center gap-3 rounded-lg bg-sky-50 px-3 py-2.5 dark:bg-sky-950/30">
                <span className="text-2xl">{weather.icon}</span>
                <div>
                  <div className="font-semibold text-sky-700 dark:text-sky-300">
                    {weather.temperature}°C · {weather.description}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Feels like {weather.feelsLike}°C · Wind {weather.windspeed} km/h
                  </div>
                </div>
              </div>
            ) : null}

            {/* Quick wiki */}
            {wikiLoading ? (
              <div className="space-y-2"><Skeleton /><Skeleton /></div>
            ) : wiki ? (
              <div className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                <p className="leading-relaxed">{wiki.extract?.slice(0, 200)}{(wiki.extract?.length ?? 0) > 200 ? "…" : ""}</p>
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Read on Wikipedia ↗
                </a>
              </div>
            ) : (
              <p className="text-zinc-400">No Wikipedia article found.</p>
            )}
          </div>
        )}

        {/* Weather */}
        {tab === "weather" && (
          <div>
            {weatherLoading ? (
              <div className="space-y-2">
                <Skeleton /><Skeleton /><Skeleton />
              </div>
            ) : weather ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-4 dark:from-sky-950/30 dark:to-blue-950/30">
                  <span className="text-5xl">{weather.icon}</span>
                  <div>
                    <div className="text-3xl font-bold text-zinc-900 dark:text-white">{weather.temperature}°C</div>
                    <div className="text-zinc-500">{weather.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <WeatherStat label="Feels like" value={`${weather.feelsLike}°C`} icon="🌡️" />
                  <WeatherStat label="Humidity" value={weather.humidity !== undefined ? `${weather.humidity}%` : "—"} icon="💧" />
                  <WeatherStat label="Wind speed" value={`${weather.windspeed} km/h`} icon="💨" />
                  <WeatherStat label="Precipitation" value={`${weather.precipitation ?? 0} mm`} icon="🌧️" />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Live data via Open-Meteo · No API key required
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-50 p-4 text-center text-zinc-400 dark:bg-zinc-800">
                Weather data unavailable for this region.
              </div>
            )}
          </div>
        )}

        {/* Wikipedia */}
        {tab === "wiki" && (
          <div>
            {wikiLoading ? (
              <div className="space-y-2"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
            ) : wiki ? (
              <div className="space-y-3">
                {wiki.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={wiki.thumbnail}
                    alt={wiki.title}
                    className="w-full rounded-xl object-cover"
                    style={{ maxHeight: 130 }}
                  />
                )}
                <h3 className="font-bold text-zinc-900 dark:text-white">{wiki.title}</h3>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{wiki.extract}</p>
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                >
                  Full article on Wikipedia ↗
                </a>
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-50 p-4 text-center text-zinc-400 dark:bg-zinc-800">
                No Wikipedia article found for &ldquo;{region}&rdquo;.
              </div>
            )}
          </div>
        )}

        {/* AI Facts */}
        {tab === "ai" && (
          <div>
            {!aiReady ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-300">
                Add your OpenAI API key in ⚙ Settings to enable AI-powered region insights.
              </div>
            ) : aiLoading ? (
              <div className="space-y-2"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
            ) : aiError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700 dark:border-red-700/40 dark:bg-red-950/30 dark:text-red-400">
                {aiError}
              </div>
            ) : ai ? (
              <div className="space-y-3">
                {/* Quick stats grid */}
                {(ai.capital || ai.population || ai.area || ai.currency || ai.language) && (
                  <div className="grid grid-cols-2 gap-2">
                    {ai.capital && ai.capital !== "N/A" && <InfoChip label="Capital" value={ai.capital} />}
                    {ai.population && <InfoChip label="Population" value={ai.population} />}
                    {ai.area && <InfoChip label="Area" value={ai.area} />}
                    {ai.currency && ai.currency !== "N/A" && <InfoChip label="Currency" value={ai.currency} />}
                    {ai.language && <InfoChip label="Language" value={ai.language} />}
                  </div>
                )}
                {/* Facts list */}
                {ai.facts?.length > 0 && (
                  <ul className="space-y-2">
                    {ai.facts.map((fact, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                        <span className="mt-0.5 shrink-0 text-indigo-500">✦</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-zinc-400">
                  AI-generated via {activeProvider === "groq" ? "Groq · Llama 3.3 (free)" : activeProvider === "gemini" ? "Gemini 1.5 Flash (free)" : "GPT-4o mini"} · Verify with official sources
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-4 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
  );
}

function WeatherStat({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-400">
        {icon && <span className="text-xs">{icon}</span>}
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-zinc-800 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-indigo-50 px-3 py-2 dark:bg-indigo-950/30">
      <div className="text-[9px] uppercase tracking-wide text-indigo-400">{label}</div>
      <div className="mt-0.5 font-semibold text-indigo-800 dark:text-indigo-200">{value}</div>
    </div>
  );
}
