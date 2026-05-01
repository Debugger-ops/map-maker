"use client";

import { useState } from "react";
import type {
  Dataset,
  MapScope,
  Palette,
  TileStyle,
  VisualizationType,
} from "@/lib/types";
import { PALETTE_LABELS, sample } from "@/lib/colorScales";
import DataUpload from "./DataUpload";
import AIAssistant from "./AIAssistant";
import LiveDataBrowser from "./LiveDataBrowser";
import SettingsPanel from "./SettingsPanel";

const PALETTE_KEYS: Palette[] = [
  "viridis", "blues", "greens", "reds", "magma", "plasma", "diverging",
];

const TILE_OPTIONS: { value: TileStyle; label: string; badge?: string }[] = [
  { value: "osm", label: "OpenStreetMap" },
  { value: "osm-dark", label: "Dark (CARTO)" },
  { value: "google-road", label: "Google Maps", badge: "🗺️" },
  { value: "google-satellite", label: "Google Satellite", badge: "🛰️" },
  { value: "google-hybrid", label: "Google Hybrid", badge: "🛰️" },
  { value: "esri-satellite", label: "ESRI Satellite", badge: "🛰️" },
  { value: "esri-topo", label: "ESRI Topo" },
];

interface Props {
  scope: MapScope;
  setScope: (s: MapScope) => void;
  presetDatasets: Dataset[];
  userDatasets: Dataset[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  visualization: VisualizationType;
  setVisualization: (v: VisualizationType) => void;
  palette: Palette;
  setPalette: (p: Palette) => void;
  search: string;
  setSearch: (s: string) => void;
  onUpload: (d: Dataset) => void;
  onDownload: () => void;
  onExportCsv: () => void;
  compareMode: boolean;
  setCompareMode: (b: boolean) => void;
  compareDatasetId: string | null;
  setCompareDatasetId: (id: string | null) => void;
  tileStyle: TileStyle;
  setTileStyle: (t: TileStyle) => void;
  groqKey: string;
  grokKey: string;
  geminiKey: string;
  openAIKey: string;
  googleMapsKey: string;
  onSaveKeys: (keys: { groqKey: string; grokKey: string; geminiKey: string; openAIKey: string; googleMapsKey: string }) => void;
  serverProvider: "groq" | "grok" | "gemini" | "openai" | "pollinations" | null;
  currentDataset: Dataset | null;
}

export default function Sidebar({
  scope,
  setScope,
  presetDatasets,
  userDatasets,
  selectedId,
  setSelectedId,
  visualization,
  setVisualization,
  palette,
  setPalette,
  search,
  setSearch,
  onUpload,
  onDownload,
  onExportCsv,
  compareMode,
  setCompareMode,
  compareDatasetId,
  setCompareDatasetId,
  tileStyle,
  setTileStyle,
  groqKey,
  grokKey,
  geminiKey,
  openAIKey,
  googleMapsKey,
  onSaveKeys,
  serverProvider,
  currentDataset,
}: Props) {
  const [openSection, setOpenSection] = useState<string | null>("ai");
  const filteredPresets = presetDatasets.filter((d) => d.scope === scope);
  const filteredUser = userDatasets.filter((d) => d.scope === scope);

  const activeProvider: "groq" | "grok" | "gemini" | "openai" | "pollinations" =
    groqKey   ? "groq"
    : grokKey   ? "grok"
    : geminiKey ? "gemini"
    : openAIKey ? "openai"
    : (serverProvider ?? "pollinations");
  const aiReady = true; // always ready

  function toggleSection(name: string) {
    setOpenSection((s) => (s === name ? null : name));
  }

  // Top 5 regions by value
  const topRegions = currentDataset?.rows
    .filter((r) => r.location && r.value !== null && r.value !== undefined)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) ?? [];

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:w-80">

      {/* ── AI Map Builder ─────────────────────────── */}
      <CollapsibleSection
        title="AI Map Builder"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="ai"
        open={openSection === "ai"}
        onToggle={toggleSection}
        badge={aiReady ? "ready" : "setup"}
        badgeColor={aiReady ? "emerald" : "amber"}
      >
        <AIAssistant
          scope={scope}
          groqKey={groqKey}
          grokKey={grokKey}
          geminiKey={geminiKey}
          openAIKey={openAIKey}
          serverProvider={serverProvider}
          onDatasetGenerated={onUpload}
        />
      </CollapsibleSection>

      {/* ── Live Data Browser ─────────────────────── */}
      <CollapsibleSection
        title={scope === "india" ? "Live Data (India States)" : "Live Data (World Bank)"}
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="live"
        open={openSection === "live"}
        onToggle={toggleSection}
        badge="free"
        badgeColor="emerald"
      >
        <LiveDataBrowser scope={scope} onDatasetLoaded={onUpload} />
      </CollapsibleSection>

      {/* ── Map scope ──────────────────────────────── */}
      <CollapsibleSection
        title="Map Region"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="scope"
        open={openSection === "scope"}
        onToggle={toggleSection}
      >
        <SegControl
          options={[
            { v: "india", label: "🇮🇳 India" },
            { v: "world", label: "🌍 World" },
          ]}
          value={scope}
          onChange={(v) => setScope(v as MapScope)}
        />
      </CollapsibleSection>

      {/* ── Dataset ────────────────────────────────── */}
      <CollapsibleSection
        title="Dataset"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="dataset"
        open={openSection === "dataset"}
        onToggle={toggleSection}
      >
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">— select a dataset —</option>
          {filteredUser.length > 0 && (
            <optgroup label="AI & Uploaded">
              {filteredUser.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </optgroup>
          )}
          <optgroup label="Preloaded">
            {filteredPresets.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </optgroup>
        </select>

        {/* Top 5 regions mini-list */}
        {topRegions.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Top regions
            </div>
            {topRegions.map((r, i) => {
              const max = topRegions[0]?.value ?? 1;
              const pct = Math.round((r.value / max) * 100);
              return (
                <div key={r.location ?? i} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-right text-[10px] font-medium tabular-nums text-zinc-400">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                        {r.location}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                        {r.value.toLocaleString()}{currentDataset?.unit ? ` ${currentDataset.unit}` : ""}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Visualization ──────────────────────────── */}
      <CollapsibleSection
        title="Visualization"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="viz"
        open={openSection === "viz"}
        onToggle={toggleSection}
      >
        <SegControl
          options={[
            { v: "choropleth", label: "Choropleth" },
            { v: "markers", label: "Markers" },
            { v: "heatmap", label: "Heatmap" },
          ]}
          value={visualization}
          onChange={(v) => setVisualization(v as VisualizationType)}
        />
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          <strong>Choropleth</strong> fills regions by value · <strong>Markers</strong> places bubbles · <strong>Heatmap</strong> shows density
        </p>
      </CollapsibleSection>

      {/* ── Palette ────────────────────────────────── */}
      <CollapsibleSection
        title="Colour Palette"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        }
        name="palette"
        open={openSection === "palette"}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_KEYS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPalette(p)}
              className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                palette === p
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              <PalettePreview palette={p} />
              {PALETTE_LABELS[p]}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Map Style (Tiles) ──────────────────────── */}
      <CollapsibleSection
        title="Map Style"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3l-7 4v14l7-4 6 4 7-4V3l-7 4-6-4z"/><path d="M9 3v14M15 7v14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="tiles"
        open={openSection === "tiles"}
        onToggle={toggleSection}
      >
        <div className="space-y-1">
          {TILE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTileStyle(opt.value)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs transition ${
                tileStyle === opt.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{opt.label}</span>
              {opt.badge && <span>{opt.badge}</span>}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── Search ─────────────────────────────────── */}
      <CollapsibleSection
        title="Search Region"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="search"
        open={openSection === "search"}
        onToggle={toggleSection}
      >
        <div className="relative">
          <input
            type="search"
            placeholder="e.g. Maharashtra or Brazil"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ✕ Clear
          </button>
        )}
      </CollapsibleSection>

      {/* ── Compare ────────────────────────────────── */}
      <CollapsibleSection
        title="Compare Datasets"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="compare"
        open={openSection === "compare"}
        onToggle={toggleSection}
      >
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          Compare two datasets
        </label>
        {compareMode && (
          <select
            value={compareDatasetId ?? ""}
            onChange={(e) => setCompareDatasetId(e.target.value || null)}
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="">— second dataset —</option>
            {[...filteredPresets, ...filteredUser]
              .filter((d) => d.id !== selectedId)
              .map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
          </select>
        )}
        {compareMode && compareDatasetId && (
          <p className="mt-2 text-[10px] text-zinc-400">
            Hover a region to see both values side by side in the info panel.
          </p>
        )}
      </CollapsibleSection>

      {/* ── Upload Data ────────────────────────────── */}
      <CollapsibleSection
        title="Upload Your Data"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        name="upload"
        open={openSection === "upload"}
        onToggle={toggleSection}
      >
        <DataUpload scope={scope} onLoaded={onUpload} />
      </CollapsibleSection>

      {/* ── Settings ───────────────────────────────── */}
      <CollapsibleSection
        title="Settings & API Keys"
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" strokeLinecap="round"/>
          </svg>
        }
        name="settings"
        open={openSection === "settings"}
        onToggle={toggleSection}
      >
        <SettingsPanel
          groqKey={groqKey}
          grokKey={grokKey}
          geminiKey={geminiKey}
          openAIKey={openAIKey}
          googleMapsKey={googleMapsKey}
          onSave={onSaveKeys}
          serverProvider={serverProvider}
        />
      </CollapsibleSection>

      {/* ── Download & Export ──────────────────────── */}
      <div className="mt-auto border-t border-zinc-100 p-4 dark:border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            type="button"
            title="Download map as PNG image"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PNG
          </button>
          <button
            onClick={onExportCsv}
            type="button"
            disabled={!currentDataset}
            title="Export current dataset as CSV"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CSV
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  name,
  open,
  onToggle,
  children,
  badge,
  badgeColor,
}: {
  title: string;
  icon?: React.ReactNode;
  name: string;
  open: boolean;
  onToggle: (name: string) => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: "emerald" | "amber";
}) {
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => onToggle(name)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {title}
          </span>
          {badge && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                badgeColor === "emerald"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function SegControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col rounded-md bg-zinc-100 p-1 dark:bg-zinc-900">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded px-2 py-1.5 text-xs font-medium transition-all ${
            value === o.v
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PalettePreview({ palette }: { palette: Palette }) {
  const stops: string[] = [];
  for (let i = 0; i <= 6; i++) {
    stops.push(`${sample(palette, i / 6)} ${(i / 6) * 100}%`);
  }
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-6 rounded"
      style={{ background: `linear-gradient(to right, ${stops.join(", ")})` }}
    />
  );
}
