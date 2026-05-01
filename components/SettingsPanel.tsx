"use client";

import { useState } from "react";

interface Props {
  groqKey: string;
  geminiKey: string;
  openAIKey: string;
  googleMapsKey: string;
  onSave: (keys: { groqKey: string; geminiKey: string; openAIKey: string; googleMapsKey: string }) => void;
  serverProvider?: "groq" | "gemini" | "openai" | null;
}

export default function SettingsPanel({ groqKey, geminiKey, openAIKey, googleMapsKey, onSave, serverProvider }: Props) {
  const [gqKey, setGqKey]     = useState(groqKey);
  const [gmKey, setGmKey]     = useState(geminiKey);
  const [aiKey, setAiKey]     = useState(openAIKey);
  const [mapsKey, setMapsKey] = useState(googleMapsKey);
  const [saved, setSaved]     = useState(false);
  const [show, setShow]       = useState({ groq: false, gemini: false, openai: false, maps: false });

  function handleSave() {
    onSave({ groqKey: gqKey.trim(), geminiKey: gmKey.trim(), openAIKey: aiKey.trim(), googleMapsKey: mapsKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-4">

      {/* Server-side active provider */}
      {serverProvider && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Server key active · {
                serverProvider === "groq"   ? "Groq · Llama 3.3 (free)" :
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
          show={show.groq} onToggle={() => toggle("groq")}
          placeholder={serverProvider === "groq" ? "Server key active · Override here" : "gsk_…"}
          className="border-violet-200 focus:border-violet-400 dark:border-violet-800/40" />
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
          show={show.gemini} onToggle={() => toggle("gemini")}
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
          show={show.openai} onToggle={() => toggle("openai")}
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
  value, onChange, show, onToggle, placeholder, className = "",
}: {
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  placeholder?: string; className?: string;
}) {
  return (
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
  );
}
