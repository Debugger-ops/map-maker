"use client";

import { useRef, useState } from "react";
import { parseCSV, parseJSON } from "@/lib/parseData";
import type { Dataset, MapScope, VisualizationType } from "@/lib/types";

interface Props {
  scope: MapScope;
  onLoaded: (dataset: Dataset) => void;
}

export default function DataUpload({ scope, onLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualText, setManualText] = useState(
    "location,value\nMaharashtra,120\nKarnataka,90\nTamil Nadu,80\n"
  );

  function handleFile(file: File) {
    setError(null);
    setInfo(null);
    const ext = file.name.toLowerCase().split(".").pop();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const result =
          ext === "json" ? parseJSON(text) : parseCSV(text);
        if (result.rows.length === 0) {
          setError(
            "No usable rows. Make sure your file has a value column (and a location or lat/lng column)."
          );
          return;
        }
        const visualization: VisualizationType = result.rows.some(
          (r) => r.lat !== undefined && r.lng !== undefined
        )
          ? "markers"
          : "choropleth";
        onLoaded({
          id: `user-${Date.now()}`,
          name: file.name,
          description: `Uploaded ${result.rows.length} rows. Detected: ${
            result.detected.locationCol ?? "—"
          } → ${result.detected.valueCol ?? "—"}`,
          scope,
          visualization,
          rows: result.rows,
          userProvided: true,
        });
        setInfo(
          `Loaded ${result.rows.length} rows · location: ${
            result.detected.locationCol ?? "—"
          } · value: ${result.detected.valueCol ?? "—"}`
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to parse file");
      }
    };
    reader.readAsText(file);
  }

  function handleManual() {
    setError(null);
    setInfo(null);
    try {
      const trimmed = manualText.trim();
      const isJson = trimmed.startsWith("[") || trimmed.startsWith("{");
      const result = isJson ? parseJSON(trimmed) : parseCSV(trimmed);
      if (result.rows.length === 0) {
        setError("Couldn't read any rows. Check formatting.");
        return;
      }
      const visualization: VisualizationType = result.rows.some(
        (r) => r.lat !== undefined && r.lng !== undefined
      )
        ? "markers"
        : "choropleth";
      onLoaded({
        id: `manual-${Date.now()}`,
        name: "Manual data",
        description: `${result.rows.length} rows from manual input`,
        scope,
        visualization,
        rows: result.rows,
        userProvided: true,
      });
      setInfo(`Loaded ${result.rows.length} rows`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse input");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Upload CSV / JSON
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Columns are auto-detected. Use a <code>location</code> column for
          regions, or <code>lat</code> + <code>lng</code> for markers.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Choose file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setShowManual((s) => !s)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {showManual ? "Hide" : "Manual"}
          </button>
        </div>
      </div>

      {showManual && (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Manual input (CSV or JSON)
          </div>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            spellCheck={false}
            className="mt-2 h-32 w-full resize-y rounded-md border border-zinc-200 bg-white p-2 font-mono text-xs text-zinc-800 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleManual}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Visualize
            </button>
          </div>
        </div>
      )}

      {info && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {info}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
