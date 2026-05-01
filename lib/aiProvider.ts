/**
 * Unified AI provider helper.
 *
 * Priority (first key wins): Groq → Gemini → OpenAI
 *
 * ── FREE OPTIONS ──────────────────────────────────────────────────────
 * Groq  (recommended)  14,400 req/day · Llama 3.3 70B · No credit card
 *   → https://console.groq.com/keys
 *
 * Gemini 1.5 Flash      1,500 req/day · No credit card
 *   → https://aistudio.google.com/app/apikey
 *
 * ── PAID FALLBACK ─────────────────────────────────────────────────────
 * OpenAI GPT-4o mini   Pay-as-you-go
 *   → https://platform.openai.com/api-keys
 */

export type AIProvider = "groq" | "gemini" | "openai";

export interface AIMessage {
  role: "system" | "user";
  content: string;
}

export interface AIProviderConfig {
  groqKey?: string;
  geminiKey?: string;
  openAIKey?: string;
}

/** Which provider will be used given the available keys. */
export function resolveProvider(cfg: AIProviderConfig): AIProvider | null {
  if (cfg.groqKey)   return "groq";
  if (cfg.geminiKey) return "gemini";
  if (cfg.openAIKey) return "openai";
  return null;
}

/** Groq – OpenAI-compatible endpoint running Llama 3.3 70B (free). */
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

/** Gemini 1.5 Flash – free Google AI (1,500 req/day). */
async function callGemini(messages: AIMessage[], geminiKey: string): Promise<string> {
  // Merge system + user into a single turn (Gemini has no system role)
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
 * Call the best available AI provider and return parsed JSON.
 */
export async function callAI<T = unknown>(
  messages: AIMessage[],
  cfg: AIProviderConfig
): Promise<{ result: T; provider: AIProvider }> {
  const provider = resolveProvider(cfg);
  if (!provider)
    throw new Error(
      "No AI key configured. Add a free Groq key (14,400 req/day) at console.groq.com"
    );

  let text: string;
  if (provider === "groq")   text = await callGroq(messages, cfg.groqKey!);
  else if (provider === "gemini") text = await callGemini(messages, cfg.geminiKey!);
  else                        text = await callOpenAI(messages, cfg.openAIKey!);

  // Strip markdown code fences if the model added them
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as T;
  return { result: parsed, provider };
}
