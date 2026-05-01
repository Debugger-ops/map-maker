import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const hasGroq   = Boolean(process.env.GROQ_API_KEY);
  const hasGrok   = Boolean(process.env.GROK_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  // Priority: Groq → Grok → Gemini → OpenAI → Pollinations (always available, no key)
  const provider: "groq" | "grok" | "gemini" | "openai" | "pollinations" =
    hasGroq ? "groq"
    : hasGrok ? "grok"
    : hasGemini ? "gemini"
    : hasOpenAI ? "openai"
    : "pollinations";

  return NextResponse.json({
    configured:   true,          // always true — Pollinations needs no key
    groq:         hasGroq,
    grok:         hasGrok,
    gemini:       hasGemini,
    openai:       hasOpenAI,
    pollinations: true,          // always available
    provider,
  });
}
