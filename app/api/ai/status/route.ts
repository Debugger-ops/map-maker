import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const hasGroq   = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  // Which provider will be used server-side (priority: Groq → Gemini → OpenAI)
  const provider: "groq" | "gemini" | "openai" | null =
    hasGroq ? "groq" : hasGemini ? "gemini" : hasOpenAI ? "openai" : null;

  return NextResponse.json({
    configured: Boolean(provider),
    groq: hasGroq,
    gemini: hasGemini,
    openai: hasOpenAI,
    provider,
  });
}
