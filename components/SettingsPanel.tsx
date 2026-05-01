"use client";

import { useState } from "react";

interface Props {
  groqKey: string;
  grokKey: string;
  geminiKey: string;
  openAIKey: string;
  googleMapsKey: string;
  onSave: (keys: { groqKey: string; grokKey: string; geminiKey: string; openAIKey: string; googleMapsKey: string }) => void;
  serverProvider?: "groq" | "grok" | "gemini" | "openai" | "pollinations" | null;
}

export default function SettingsPanel({ groqKey, grokKey, geminiKey, openAIKey, googleMapsKey, onSave, serverProvider }: Props) {
  const [gqKey, setGqKey]     = useState(groqKey);
  const [grkKey, setGrkKey]   = useState(grokKey);
  const [gmKey, setGmKey]     = useState(geminiKey);
  const [aiKey, setAiKey]     = useState(openAIKey);
  const [mapsKey, setMapsKey] = useState(googleMapsKey);
  const [saved, setSaved]     = useState(false);
  const [show, setShow]       = useState({ groq: false, grok: false, gemini: false, openai: false, maps: false });

  function clearKey(which: "groq" | "grok" | "gemini" | "openai" | "maps") {
    if (which === "groq")   setGqKey("");
    if (which === "grok")   setGrkKey("");
    if (which === "gemini") setGmKey("");
    if (which === "openai") setAiKey("");
    if (which === "maps")   setMapsKey("");
    setSaved(false);
  }

  function handleSave() {
    onSave({ groqKey: gqKey.trim(), grokKey: grkKey.trim(), geminiKey: gmKey.trim(), openAIKey: aiKey.trim(), googleMapsKey: mapsKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-4">

      {/* ── Pollinations (zero-key, always on) ── */}
      <div className="rounded-lg border-2 border-fuchsia-200 bg-fuchsia-50/60 p-3 dark:border-fuchsia-800/50 dark:bg-fuchsia-950/20">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-[12px] font-bold text-fuchsia-700 dark:text-fuchsia-300">Pollinations AI</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">FREE</span>
          <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-medium text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300">NO KEY NEEDED</span>
        </div>
        <p className="text-[10px] leading-relaxed text-fuchsia-600 dark:text-fuchsia-400">
          Built-in free AI — works right now with zero setup. No account, no credit card.
          Add Groq below for faster responses.
        </p>
      </div>

      {/* Server-side active provider */}
      {serverProvider && serverProvider !== "pollinations" && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Server key active · {
                serverProvider === "groq"   ? "Groq · Llama 3.3 (free)" :
                serverProvider === "grok"   ? "Grok (xAI)" :
                serverProvider === "gemini" ? "Gemini 1.5 Flash (free)" :
                "OpenAI GPT-4o mini"
              }
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
              AI features work — no personal key needed.
            </div>
          </div>
        </div>
      )}

      {/* ── GROQ (FREE · BEST) ── */}
      <div className="rounded-lg border-2 border-violet-200 bg-violet-50/60 p-3 dark:border-violet-800/50 dark:bg-violet-950/20">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-[12px] font-bold text-violet-700 dark:text-violet-300">Groq</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">FREE</span>
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">RECOMMENDED</span>
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-violet-600 dark:text-violet-400">
          Llama 3.3 70B · 14,400 req/day · No credit card.{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
            className="font-semibold underline hover:text-violet-800 dark:hover:text-violet-200">
            Get free key →
          </a>
        </p>
        <KeyInput value={gqKey} onChange={(v) => { setGqKey(v); setSaved(false); }}
          show={show.groq} onToggle={() => toggle("groq")} onClear={() => clearKey("groq")}
          placeholder={serverProvider === "groq" ? "Server key active · Override here" : "gsk_…"}
          className="border-violet-200 focus:border-violet-400 dark:border-violet-800/40" />
      </div>

      {/* ── GROK (xAI) ── */}
      <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3 dark:border-sky-900/40 dark:bg-sky-950/20">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm">𝕏</span>
          <span className="text-[12px] font-bold text-sky-700 dark:text-sky-300">Grok (xAI)</span>
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-medium text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">$25 FREE CREDIT</span>
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-sky-600 dark:text-sky-400">
          Grok-2 by xAI · $25 free credit on signup · No credit card until credit runs out.{" "}
          <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer"
            className="font-semibold underline hover:text-sky-800 dark:hover:text-sky-200">
            Get key at console.x.ai →
          </a>
        </p>
        <KeyInput value={grkKey} onChange={(v) => { setGrkKey(v); setSaved(false); }}
          show={show.grok} onToggle={() => toggle("grok")} onClear={() => clearKey("grok")}
          placeholder={serverProvider === "grok" ? "Server key active · Override here" : "xai-…"}
          className="border-sky-200 focus:border-sky-400 dark:border-sky-800/40" />
      </div>

      {/* ── GEMINI (FREE) ── */}
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-[12px] font-bold text-blue-700 dark:text-blue-300">Google Gemini</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">FREE</span>
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-blue-600 dark:text-blue-400">
          Gemini 1.5 Flash · 1,500 req/day · No credit card.{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="font-semibold underline hover:text-blue-800 dark:hover:text-blue-200">
            Get free key →
          </a>
        </p>
        <KeyInput value={gmKey} onChange={(v) => { setGmKey(v); setSaved(false); }}
          show={show.gemini} onToggle={() => toggle("gemini")} onClear={() => clearKey("gemini")}
          placeholder={serverProvider === "gemini" ? "Server key active · Override here" : "AIzaSy…"}
          className="border-blue-200 focus:border-blue-400 dark:border-blue-800/40" />
      </div>

      {/* ── OPENAI (PAID FALLBACK) ── */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">OpenAI GPT-4o mini</label>
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">paid fallback</span>
        </div>
        <KeyInput value={aiKey} onChange={(v) => { setAiKey(v); setSaved(false); }}
          show={show.openai} onToggle={() => toggle("openai")} onClear={() => clearKey("openai")}
          placeholder={serverProvider === "openai" ? "Server key active · Override here" : "sk-…"} />
        <p className="mt-1 text-[10px] text-zinc-400">
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">platform.openai.com</a>
        </p>
      </div>

      {/* ── GOOGLE MAPS ── */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          Google Maps API Key <span className="text-[10px] text-zinc-400">(satellite tiles)</span>
        </label>
        <KeyInput value={mapsKey} onChange={(v) => { setMapsKey(v); setSaved(false); }}
          show={show.maps} onToggle={() => toggle("maps")} placeholder="AIza…" />
      </div>

      <button onClick={handleSave} type="button"
        className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          saved ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}>
        {saved ? "✓ Saved" : "Save keys"}
      </button>

      <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Keys are stored only in your browser — never sent to our server.
      </p>
    </div>
  );
}

function KeyInput({
  value, onChange, show, onToggle, onClear, placeholder, className = "",
}: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  onClear?: () => void;
  placeholder?: string; className?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`block w-full rounded-md border bg-white py-2 pl-3 pr-9 font-mono text-xs text-zinc-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 ${className}`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          {show ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      {/* Show a Clear button when a key is saved, so users can easily remove invalid keys */}
      {value && onClear && (
        <button type="button" onClick={onClear}
          className="text-[10px] text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">
          ✕ Clear key
        </button>
      )}
    </div>
  );
}
