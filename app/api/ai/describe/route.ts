import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/aiProvider";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? "";
  const scope  = searchParams.get("scope")  ?? "world";

  const groqKey   = req.headers.get("x-groq-key")   ?? process.env.GROQ_API_KEY   ?? "";
  const geminiKey = req.headers.get("x-gemini-key") ?? process.env.GEMINI_API_KEY ?? "";
  const openAIKey = req.headers.get("x-openai-key") ?? process.env.OPENAI_API_KEY ?? "";

  if (!region) return NextResponse.json({ error: "Missing region" }, { status: 400 });
  if (!groqKey && !geminiKey && !openAIKey)
    return NextResponse.json(
      { error: "No AI key configured. Add a free Groq key at console.groq.com" },
      { status: 401 }
    );

  const prompt = `You are a concise geographic encyclopedia. Give 4 fascinating, data-rich facts about "${region}" (${
    scope === "india" ? "an Indian state/UT" : "a country/territory"
  }).
Each fact must include a specific number or statistic. Keep each fact under 30 words.
Respond ONLY with this exact JSON:
{"facts":["fact1","fact2","fact3","fact4"],"capital":"city name or N/A","population":"X million","area":"X km²","currency":"name or N/A","language":"primary language"}`;

  try {
    const { result, provider } = await callAI<{
      facts: string[];
      capital?: string;
      population?: string;
      area?: string;
      currency?: string;
      language?: string;
    }>(
      [{ role: "user", content: prompt }],
      { groqKey, geminiKey, openAIKey }
    );

    return NextResponse.json({ ...result, _provider: provider });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
