/**
 * Unified AI provider helper.
 *
 * Priority (first key wins): Groq → Grok (xAI) → Gemini → OpenAI → Pollinations
 *
 * ── FREE OPTIONS (no credit card needed) ──────────────────────────────
 * Pollinations  ZERO KEY · unlimited · built-in · works right now
 *   → https://pollinations.ai  (no signup, no key)
 *
 * Groq          FREE key · 14,400 req/day · Llama 3.3 70B · fastest
 *   → https://console.groq.com/keys
 *
 * Gemini 1.5 Flash   FREE key · 1,500 req/day · Google
 *   → https://aistudio.google.com/app/apikey
 *
 * ── PAID OPTIONS ──────────────────────────────────────────────────────
 * Grok (xAI)    Pay-as-you-go · Grok-2 · $25 free credit on signup
 *   → https://console.x.ai
 *
 * OpenAI GPT-4o mini   Pay-as-you-go
 *   → https://platform.openai.com/api-keys
 */

export type AIProvider = "groq" | "grok" | "gemini" | "openai" | "pollinations";

export interface AIMessage {
  role: "system" | "user";
  content: string;
}

export interface AIProviderConfig {
  groqKey?:   string;
  grokKey?:   string; // xAI Grok
  geminiKey?: string;
  openAIKey?: string;
  /** No key needed for Pollinations — always available as fallback. */
  usePollinations?: boolean;
}

/** Which provider will be used given the available keys. */
export function resolveProvider(cfg: AIProviderConfig): AIProvider {
  if (cfg.groqKey?.trim())   return "groq";
  if (cfg.grokKey?.trim())   return "grok";
  if (cfg.geminiKey?.trim()) return "gemini";
  if (cfg.openAIKey?.trim()) return "openai";
  return "pollinations"; // always available, no key needed
}

/** Groq – OpenAI-compatible endpoint running Llama 3.3 70B (free key). */
async function callGroq(messages: AIMessage[], groqKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned an empty response");
  return text;
}

/**
 * xAI Grok — OpenAI-compatible API.
 * Get key + $25 free credit at https://console.x.ai
 */
async function callGrok(messages: AIMessage[], grokKey: string): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${grokKey}`,
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Grok returned an empty response");
  return text;
}

/** Gemini 1.5 Flash – free Google AI (1,500 req/day). */
async function callGemini(messages: AIMessage[], geminiKey: string): Promise<string> {
  const combined = messages
    .map((m) => (m.role === "system" ? `[Instructions]\n${m.content}` : m.content))
    .join("\n\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combined }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 3000,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/** OpenAI GPT-4o mini (paid fallback). */
async function callOpenAI(messages: AIMessage[], openAIKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenAI returned an empty response");
  return text;
}

/**
 * Pollinations AI – completely free, no API key required.
 * Uses OpenAI-compatible endpoint at text.pollinations.ai.
 */
async function callPollinations(messages: AIMessage[]): Promise<string> {
  // Inject JSON instruction into user message since we can't rely on response_format
  const augmented = messages.map((m) => {
    if (m.role === "user") {
      return {
        role: m.role,
        content: m.content.includes("JSON")
          ? m.content
          : m.content + "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no extra text.",
      };
    }
    return { role: m.role, content: m.content };
  });

  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai-large",
      messages: augmented,
      temperature: 0.4,
      private: true,    // don't expose in Pollinations public feed
      seed: 42,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pollinations API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Pollinations returned an empty response");
  return text;
}

/**
 * Extract JSON from a string that may have surrounding text or code fences.
 * More robust than a simple trim — finds the first { ... } block.
 */
function extractJSON(raw: string): string {
  // Strip markdown code fences
  let cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Try to find outermost JSON object
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

/**
 * Call the best available AI provider and return parsed JSON.
 * Always succeeds — falls back to Pollinations (free, no key) if no keys configured.
 */
export async function callAI<T = unknown>(
  messages: AIMessage[],
  cfg: AIProviderConfig
): Promise<{ result: T; provider: AIProvider }> {
  const provider = resolveProvider(cfg);

  let text: string;
  if (provider === "groq")
    text = await callGroq(messages, cfg.groqKey!);
  else if (provider === "grok")
    text = await callGrok(messages, cfg.grokKey!);
  else if (provider === "gemini")
    text = await callGemini(messages, cfg.geminiKey!);
  else if (provider === "openai")
    text = await callOpenAI(messages, cfg.openAIKey!);
  else
    text = await callPollinations(messages);

  const cleaned = extractJSON(text);
  const parsed  = JSON.parse(cleaned) as T;
  return { result: parsed, provider };
}
