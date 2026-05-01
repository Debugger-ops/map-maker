"use client";

import { useState, useRef } from "react";
import type { Dataset, MapScope } from "@/lib/types";

interface Props {
  scope: MapScope;
  groqKey: string;
  grokKey: string;
  geminiKey: string;
  openAIKey: string;
  serverProvider: "groq" | "grok" | "gemini" | "openai" | "pollinations" | null;
  onDatasetGenerated: (d: Dataset) => void;
}

interface HistoryItem {
  prompt: string;
  status: "ok" | "error";
  provider?: "groq" | "grok" | "gemini" | "openai" | "pollinations";
  dataSource?: "worldbank" | "ai-estimated";
  message: string;
}

const INDIA_EXAMPLES = [
  "Literacy rate across Indian states",
  "Internet penetration by state",
  "Unemployment rate by state",
  "Rainfall by Indian state",
  "Air quality index by state",
  "Number of hospitals per state",
];

const WORLD_EXAMPLES = [
  "GDP per capita by country",
  "Life expectancy worldwide",
  "CO₂ emissions per capita",
  "Unemployment rate by country",
  "Renewable electricity by country",
  "Internet users by country",
  "Inflation rate by country",
  "Child mortality rate",
];

const PROVIDER_STYLE = {
  pollinations: { label: "Pollinations AI",    badge: "FREE · NO KEY", dot: "bg-fuchsia-500", pill: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200 dark:text-fuchsia-300 dark:bg-fuchsia-950/30 dark:border-fuchsia-800/40" },
  groq:         { label: "Groq · Llama 3.3",  badge: "FREE",          dot: "bg-violet-500",  pill: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-950/30 dark:border-violet-800/40" },
  grok:         { label: "Grok · xAI",        badge: "",              dot: "bg-sky-500",     pill: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/30 dark:border-sky-800/40" },
  gemini:       { label: "Gemini 1.5 Flash",  badge: "FREE",          dot: "bg-blue-500",    pill: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-800/40" },
  openai:       { label: "GPT-4o mini",       badge: "",              dot: "bg-emerald-500", pill: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800/40" },
};

export default function AIAssistant({ scope, groqKey, grokKey, geminiKey, openAIKey, serverProvider, onDatasetGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const examples = scope === "india" ? INDIA_EXAMPLES : WORLD_EXAMPLES;
  // Pollinations is always available (no key needed) — AI is always ready
  const activeProvider: "groq" | "grok" | "gemini" | "openai" | "pollinations" =
    groqKey   ? "groq"
    : grokKey   ? "grok"
    : geminiKey ? "gemini"
    : openAIKey ? "openai"
    : (serverProvider ?? "pollinations");
  const aiReady = true;

  async function handleGenerate() {
    const q = prompt.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setProgress(scope === "world" ? "Identifying best dataset…" : "Generating dataset…");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if      (groqKey)   headers["x-groq-key"]   = groqKey;
      else if (grokKey)   headers["x-grok-key"]   = grokKey;
      else if (geminiKey) headers["x-gemini-key"] = geminiKey;
      else if (openAIKey) headers["x-openai-key"] = openAIKey;

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: q, scope }),
      });

      setProgress(scope === "world" ? "Fetching live World Bank data…" : "Building map…");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");

      const prov       = data._provider   as "groq" | "gemini" | "openai" | undefined;
      const dataSrc    = data._dataSource as "worldbank" | "ai-estimated" | undefined;
      const isRealData = dataSrc === "worldbank";

      const dataset: Dataset = {
        id: `ai-${Date.now()}`,
        name: `${isRealData ? "🌍" : "🤖"} ${data.name}`,
        description: data.explanation
          ? `${data.description} (${data.explanation})`
          : data.description,
        scope: data.scope ?? scope,
        visualization: "choropleth",
        unit: data.unit ?? "",
        rows: (data.rows ?? []).map((r: { location: string; value: number }) => ({
          location: r.location,
          value: r.value,
        })),
        userProvided: true,
      };

      onDatasetGenerated(dataset);
      setHistory((h) => [{ prompt: q, status: "ok", provider: prov, dataSource: dataSrc, message: dataset.name }, ...h.slice(0, 4)]);
      setPrompt("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setHistory((h) => [{ prompt: q, status: "error", message: msg }, ...h.slice(0, 4)]);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Provider badge — always shown, always ready */}
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${PROVIDER_STYLE[activeProvider].pill}`}>
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${PROVIDER_STYLE[activeProvider].dot}`} />
        {PROVIDER_STYLE[activeProvider].label}
        {PROVIDER_STYLE[activeProvider].badge && (
          <span className="rounded-full bg-emerald-100 px-1 py-px text-[8px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {PROVIDER_STYLE[activeProvider].badge}
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder={scope === "india" ? "e.g. literacy rate by state…" : "e.g. happiness index by country…"}
          disabled={loading}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <button type="button" onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {loading ? "…" : "Go"}
        </button>
      </div>

      {/* Progress */}
      {loading && progress && (
        <div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"/>
          </svg>
          {progress}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Examples */}
      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Try an example</div>
        <div className="flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button key={ex} type="button"
              onClick={() => { setPrompt(ex); setError(null); inputRef.current?.focus(); }}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Recent</div>
          {history.map((h, i) => (
            <div key={i} onClick={() => h.status === "ok" && setPrompt(h.prompt)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${
                h.status === "ok"
                  ? "cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              }`}>
              <span>{h.status === "ok" ? "✓" : "✗"}</span>
              <span className="flex-1 truncate">{h.prompt}</span>
              {h.dataSource === "worldbank" && (
                <span className="shrink-0 rounded px-1 py-px text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Real Data
                </span>
              )}
              {h.provider && (
                <span className={`shrink-0 rounded px-1 py-px text-[9px] font-medium ${
                  h.provider === "groq"         ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300" :
                  h.provider === "grok"         ? "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300" :
                  h.provider === "gemini"       ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" :
                  h.provider === "pollinations" ? "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-300" :
                                                  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}>
                  {h.provider === "groq" ? "Groq" : h.provider === "grok" ? "Grok" : h.provider === "gemini" ? "Gemini" : h.provider === "pollinations" ? "Pollinations" : "GPT"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
