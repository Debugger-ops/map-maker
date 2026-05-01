"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";
import InfoPanel from "@/components/InfoPanel";
import ThemeToggle from "@/components/ThemeToggle";
import RegionDetailPanel from "@/components/RegionDetailPanel";
import { findDataset, PRELOADED } from "@/lib/datasets";
import { stats, normalizeName } from "@/lib/parseData";
import type {
  Dataset,
  HoverInfo,
  MapScope,
  Palette,
  SelectedRegion,
  TileStyle,
  VisualizationType,
} from "@/lib/types";

// Leaflet hits `window`; render the map only on the client.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="10" />
        </svg>
        <span className="text-sm">Loading map…</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const [scope, setScope] = useState<MapScope>("india");
  const [selectedId, setSelectedId] = useState<string | null>("india-population");
  const [userDatasets, setUserDatasets] = useState<Dataset[]>([]);
  const [visualization, setVisualization] = useState<VisualizationType>("choropleth");
  const [palette, setPalette] = useState<Palette>("viridis");
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [tileStyle, setTileStyle] = useState<TileStyle>("osm");
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null);

  // API keys — stored in localStorage
  const [groqKey, setGroqKey]         = useState<string>("");
  const [grokKey, setGrokKey]         = useState<string>("");
  const [geminiKey, setGeminiKey]     = useState<string>("");
  const [openAIKey, setOpenAIKey]     = useState<string>("");
  const [googleMapsKey, setGoogleMapsKey] = useState<string>("");

  // Which AI provider the server has configured (pollinations = free built-in fallback)
  const [serverProvider, setServerProvider] = useState<"groq" | "grok" | "gemini" | "openai" | "pollinations" | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("mm-theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  const mapElRef = useRef<HTMLDivElement>(null);

  // Check server AI key status
  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setServerProvider(d.provider ?? null))
      .catch(() => {});
  }, []);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const grKey  = window.localStorage.getItem("mm-groq-key")        ?? "";
    const grkKey = window.localStorage.getItem("mm-grok-key")        ?? "";
    const geKey  = window.localStorage.getItem("mm-gemini-key")      ?? "";
    const aiKey  = window.localStorage.getItem("mm-openai-key")      ?? "";
    const gmKey  = window.localStorage.getItem("mm-google-maps-key") ?? "";
    setGroqKey(grKey);
    setGrokKey(grkKey);
    setGeminiKey(geKey);
    setOpenAIKey(aiKey);
    setGoogleMapsKey(gmKey);
  }, []);

  // Persist theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("mm-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Persist tile style
  useEffect(() => {
    window.localStorage.setItem("mm-tile-style", tileStyle);
  }, [tileStyle]);

  // Load tile style from localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem("mm-tile-style") as TileStyle | null;
    if (stored) setTileStyle(stored);
  }, []);

  const handleSaveKeys = useCallback(
    ({ groqKey: grKey, grokKey: grkKey, geminiKey: geKey, openAIKey: aiKey, googleMapsKey: gmKey }: {
      groqKey: string; grokKey: string; geminiKey: string; openAIKey: string; googleMapsKey: string
    }) => {
      setGroqKey(grKey);
      setGrokKey(grkKey);
      setGeminiKey(geKey);
      setOpenAIKey(aiKey);
      setGoogleMapsKey(gmKey);
      window.localStorage.setItem("mm-groq-key",        grKey);
      window.localStorage.setItem("mm-grok-key",        grkKey);
      window.localStorage.setItem("mm-gemini-key",      geKey);
      window.localStorage.setItem("mm-openai-key",      aiKey);
      window.localStorage.setItem("mm-google-maps-key", gmKey);
    },
    []
  );

  const resolved = useMemo<Dataset | null>(() => {
    const all = [...userDatasets, ...PRELOADED];
    const current = selectedId ? all.find((d) => d.id === selectedId) : null;
    if (current && current.scope === scope) return current;
    return all.find((d) => d.scope === scope) ?? null;
  }, [scope, selectedId, userDatasets]);

  const dataset = resolved;

  const selectDataset = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      const d = userDatasets.find((u) => u.id === id) ?? findDataset(id);
      if (d) setVisualization(d.visualization);
    },
    [userDatasets]
  );

  const switchScope = useCallback(
    (newScope: MapScope) => {
      setScope(newScope);
      setSelectedRegion(null);
      const all = [...userDatasets, ...PRELOADED];
      const current = selectedId ? all.find((d) => d.id === selectedId) : null;
      if (!current || current.scope !== newScope) {
        const first = all.find((d) => d.scope === newScope);
        if (first) {
          setSelectedId(first.id);
          setVisualization(first.visualization);
        } else {
          setSelectedId(null);
        }
      }
    },
    [selectedId, userDatasets]
  );

  const compareDataset = useMemo<Dataset | null>(() => {
    if (!compareMode || !compareId) return null;
    return (
      userDatasets.find((d) => d.id === compareId) ??
      findDataset(compareId) ??
      null
    );
  }, [compareMode, compareId, userDatasets]);

  const s = useMemo(
    () => (dataset ? stats(dataset.rows) : { min: 0, max: 0 }),
    [dataset]
  );

  const onUpload = useCallback((d: Dataset) => {
    setUserDatasets((prev) => [d, ...prev]);
    setScope(d.scope);
    setSelectedId(d.id);
    setVisualization(d.visualization);
  }, []);

  const onDownload = useCallback(async () => {
    const node = mapElRef.current;
    if (!node) return;
    const { toPng } = await import("html-to-image");
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        filter: () => true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${dataset?.id ?? "map"}.png`;
      a.click();
    } catch (e) {
      console.error("download failed", e);
      alert("Couldn't capture the map. Try again in a moment.");
    }
  }, [dataset]);

  const onExportCsv = useCallback(() => {
    if (!dataset) return;
    const header = ["location", "value", dataset.unit ? `unit` : ""].filter(Boolean).join(",");
    const rows = dataset.rows.map((r) => {
      const loc = r.location ?? r.label ?? "";
      const val = r.value ?? "";
      return dataset.unit
        ? `"${loc}",${val},"${dataset.unit}"`
        : `"${loc}",${val}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset.id ?? "dataset"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataset]);

  const compareHoverValue = useMemo<number | null | undefined>(() => {
    if (!compareDataset || !hover?.name) return undefined;
    const norm = normalizeName(hover.name).toLowerCase();
    const row = compareDataset.rows.find(
      (r) => r.location && normalizeName(r.location).toLowerCase() === norm
    );
    return row?.value ?? null;
  }, [compareDataset, hover]);

  // Compute rank of selected region in the dataset
  const selectedRank = useMemo(() => {
    if (!selectedRegion || !dataset) return undefined;
    const sorted = [...dataset.rows]
      .filter((r) => r.value !== null && r.value !== undefined)
      .sort((a, b) => b.value - a.value);
    const idx = sorted.findIndex(
      (r) => (r.location ?? r.label ?? "").toLowerCase() === selectedRegion.name.toLowerCase()
    );
    return idx >= 0 ? idx + 1 : undefined;
  }, [selectedRegion, dataset]);

  const handleRegionClick = useCallback(
    (info: { name: string; value: number | null; unit?: string }) => {
      setSelectedRegion(info);
    },
    []
  );

  const isSatelliteTile =
    tileStyle === "google-satellite" ||
    tileStyle === "google-hybrid" ||
    tileStyle === "esri-satellite";

  const activeProvider: "groq" | "grok" | "gemini" | "openai" | "pollinations" =
    groqKey   ? "groq"
    : grokKey   ? "grok"
    : geminiKey ? "gemini"
    : openAIKey ? "openai"
    : (serverProvider ?? "pollinations");
  const aiReady = true; // always ready — Pollinations needs no key

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 3l-7 4v14l7-4 6 4 7-4V3l-7 4-6-4z" />
              <path d="M9 3v14M15 7v14" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Map Maker AI</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
              AI-powered · Live data · India &amp; World
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tile badge */}
          <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 sm:inline">
            {isSatelliteTile ? "🛰️ " : "🗺️ "}{tileStyle}
          </span>
          {/* AI status badge — always shown */}
          <span className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline-flex ${
            activeProvider === "groq"           ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            : activeProvider === "grok"         ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
            : activeProvider === "gemini"       ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : activeProvider === "pollinations" ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse opacity-70" />
            {activeProvider === "groq"          ? "⚡ Groq (free)"
             : activeProvider === "grok"        ? "✨ Grok (xAI)"
             : activeProvider === "gemini"      ? "✨ Gemini (free)"
             : activeProvider === "pollinations"? "✨ AI (free · no key)"
             : "✨ GPT-4o mini"}
          </span>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ───────────────────────────────── */}
        <Sidebar
          scope={scope}
          setScope={switchScope}
          presetDatasets={PRELOADED}
          userDatasets={userDatasets}
          selectedId={selectedId}
          setSelectedId={selectDataset}
          visualization={visualization}
          setVisualization={setVisualization}
          palette={palette}
          setPalette={setPalette}
          search={search}
          setSearch={setSearch}
          onUpload={onUpload}
          onDownload={onDownload}
          onExportCsv={onExportCsv}
          compareMode={compareMode}
          setCompareMode={setCompareMode}
          compareDatasetId={compareId}
          setCompareDatasetId={setCompareId}
          tileStyle={tileStyle}
          setTileStyle={setTileStyle}
          groqKey={groqKey}
          grokKey={grokKey}
          geminiKey={geminiKey}
          openAIKey={openAIKey}
          googleMapsKey={googleMapsKey}
          onSaveKeys={handleSaveKeys}
          serverProvider={serverProvider}
          currentDataset={dataset}
        />

        {/* ── Map ───────────────────────────────────── */}
        <main className="relative flex-1">
          <div ref={mapElRef} className="absolute inset-0">
            <MapView
              scope={scope}
              dataset={dataset}
              visualization={visualization}
              palette={palette}
              search={search}
              isDark={isDark}
              tileStyle={tileStyle}
              googleMapsKey={googleMapsKey}
              onHover={setHover}
              onRegionClick={handleRegionClick}
            />
          </div>

          {/* Info panel (top-left) */}
          <div className="pointer-events-none absolute left-4 top-4 z-[400] w-72 max-w-[calc(100%-2rem)] space-y-3">
            <div className="pointer-events-auto">
              <InfoPanel
                dataset={dataset}
                hover={hover}
                compareDataset={compareDataset}
                compareHoverValue={compareHoverValue}
              />
            </div>
          </div>

          {/* Region detail panel (top-right) */}
          {selectedRegion && (
            <div className="pointer-events-none absolute right-4 top-4 z-[500] max-w-[calc(100%-2rem)]">
              <div className="pointer-events-auto">
                <RegionDetailPanel
                  region={selectedRegion.name}
                  value={selectedRegion.value}
                  unit={selectedRegion.unit}
                  rank={selectedRank}
                  totalRegions={dataset?.rows.filter((r) => r.value !== null).length}
                  scope={scope}
                  groqKey={groqKey}
                  grokKey={grokKey}
                  geminiKey={geminiKey}
                  openAIKey={openAIKey}
                  serverProvider={serverProvider}
                  onClose={() => setSelectedRegion(null)}
                />
              </div>
            </div>
          )}

          {/* Legend (bottom-left) */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-[400] w-72 max-w-[calc(100%-2rem)]">
            <div className="pointer-events-auto">
              <Legend
                palette={palette}
                min={s.min}
                max={s.max}
                unit={dataset?.unit}
                title={dataset?.name}
              />
            </div>
          </div>

          {/* Search active hint */}
          {search && (
            <div className="pointer-events-none absolute right-4 bottom-4 z-[400] rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-amber-800 shadow-sm backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-300">
              Highlighting &ldquo;{search}&rdquo; · Click any region for insights
            </div>
          )}

          {/* Click hint when no region selected */}
          {!selectedRegion && !search && dataset && (
            <div className="pointer-events-none absolute bottom-20 right-4 z-[400] flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-[11px] text-zinc-500 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 3l14 9-14 9V3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Click any region for weather, AI facts &amp; Wikipedia
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
