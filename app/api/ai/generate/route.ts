import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/aiProvider";
import { LIVE_INDICATORS } from "@/lib/liveIndicators";

export const runtime = "edge";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Island","Chandigarh","Dadara & Nagar Havelli","Daman & Diu",
  "Jammu & Kashmir","Ladakh","Lakshadweep","NCT of Delhi","Puducherry",
];

const WORLD_COUNTRIES = [
  "United States of America","China","India","Brazil","Russia","United Kingdom","Germany",
  "France","Japan","Canada","Australia","South Korea","Italy","Spain","Mexico","Indonesia",
  "Turkey","Saudi Arabia","Netherlands","Switzerland","Argentina","Sweden","Poland",
  "Thailand","Egypt","Nigeria","South Africa","Kenya","Ethiopia","Bangladesh",
  "Pakistan","Vietnam","Malaysia","Philippines","Colombia","Chile","Peru","Ukraine",
  "Romania","Czech Republic","Portugal","Greece","Hungary","Finland","Norway","Denmark",
  "New Zealand","Israel","Singapore","Ireland","Austria","Belgium","Iran","Iraq",
  "Algeria","Morocco","Tanzania","Sudan","Uganda","Ghana","Mozambique","Madagascar",
  "Angola","Cameroon","Zimbabwe","Zambia","Senegal","Tunisia","Libya","Bolivia",
  "Venezuela","Paraguay","Uruguay","Ecuador","Cuba","Guatemala","Honduras","Nicaragua",
  "Costa Rica","Panama","Dominican Republic","Haiti","Jamaica","Trinidad and Tobago",
  "Serbia","Croatia","Slovakia","Slovenia","Bulgaria","Bosnia and Herz.","Albania",
  "Georgia","Armenia","Azerbaijan","Belarus","Moldova","Kazakhstan","Uzbekistan",
  "Turkmenistan","Tajikistan","Kyrgyzstan","Mongolia","Myanmar","Cambodia","Laos",
  "Sri Lanka","Nepal","Afghanistan","Iraq","Jordan","Lebanon","Yemen","Oman",
  "Kuwait","Qatar","Bahrain","United Arab Emirates","Syria","Libya",
];

/** Build a compact indicator catalogue string for the AI prompt. */
const INDICATOR_LIST = LIVE_INDICATORS.map(
  (i) => `${i.id}|${i.name}|${i.unit}|${i.category}`
).join("\n");

/**
 * Step 1 — Ask AI to identify the best World Bank indicator.
 * Returns null if AI cannot confidently identify one.
 */
async function identifyWorldBankIndicator(
  prompt: string,
  cfg: { groqKey?: string; geminiKey?: string; openAIKey?: string }
): Promise<{ indicatorId: string; unit: string; name: string } | null> {
  try {
    const systemMsg = `You are a World Bank data expert. Given a user request, identify the single best World Bank indicator from the list below.

Indicator list (id|name|unit|category):
${INDICATOR_LIST}

Respond ONLY with JSON: {"indicatorId":"...","name":"...","unit":"...","confidence":"high"|"medium"|"low"}
If no indicator fits well, respond: {"indicatorId":null}`;

    const userMsg = `User wants to map: "${prompt}"`;

    const { result } = await callAI<{
      indicatorId: string | null;
      name?: string;
      unit?: string;
      confidence?: string;
    }>(
      [
        { role: "system", content: systemMsg },
        { role: "user",   content: userMsg },
      ],
      cfg
    );

    if (!result.indicatorId || result.confidence === "low") return null;
    return {
      indicatorId: result.indicatorId,
      unit:        result.unit  ?? "",
      name:        result.name  ?? result.indicatorId,
    };
  } catch {
    return null;
  }
}

/**
 * Step 2 — Fetch real data from World Bank via our proxy route.
 */
async function fetchWorldBankData(
  indicatorId: string,
  year: number,
  baseUrl: string
): Promise<Array<{ location: string; value: number }> | null> {
  try {
    const url = `${baseUrl}/api/worldbank?indicator=${encodeURIComponent(indicatorId)}&year=${year}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      rows?: Array<{ country: string; value: number | null }>;
    };

    if (!data.rows || data.rows.length < 10) return null;

    return data.rows
      .filter((r) => r.value !== null && r.value !== undefined)
      .map((r) => ({ location: r.country, value: r.value as number }));
  } catch {
    return null;
  }
}

/**
 * Step 3 — Fall back to AI-estimated values if World Bank data isn't available.
 */
async function generateAIEstimatedData(
  prompt: string,
  scope: string,
  locationList: string,
  scopeLabel: string,
  cfg: { groqKey?: string; geminiKey?: string; openAIKey?: string }
): Promise<{
  name: string;
  description: string;
  scope: string;
  unit: string;
  explanation: string;
  rows: { location: string; value: number }[];
}> {
  const systemPrompt = `You are a geographic data generation assistant. Generate a plausible dataset for a choropleth map.

Rules:
1. Respond ONLY with valid JSON — no markdown, no text outside JSON
2. Use realistic estimated values based on real-world data
3. Include as many locations from the provided list as possible
4. Exact schema required: {"name":"...","description":"...","scope":"${scope}","unit":"...","explanation":"one sentence about the data source or note values are AI-estimated","rows":[{"location":"...","value":number}]}
5. Locations must exactly match names from: ${locationList}
6. Values must be positive numbers`;

  const userPrompt = `Generate a map dataset for: "${prompt}"\nScope: ${scopeLabel}\nReturn JSON only.`;

  const { result } = await callAI<{
    name: string;
    description: string;
    scope: string;
    unit: string;
    explanation: string;
    rows: { location: string; value: number }[];
  }>(
    [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    cfg
  );

  return result;
}

export async function POST(req: NextRequest) {
  const { prompt, scope } = await req.json() as { prompt: string; scope: string };

  // Client headers take priority; server env vars are the fallback
  const groqKey   = req.headers.get("x-groq-key")   ?? process.env.GROQ_API_KEY   ?? "";
  const grokKey   = req.headers.get("x-grok-key")   ?? process.env.GROK_API_KEY   ?? "";
  const geminiKey = req.headers.get("x-gemini-key") ?? process.env.GEMINI_API_KEY ?? "";
  const openAIKey = req.headers.get("x-openai-key") ?? process.env.OPENAI_API_KEY ?? "";

  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  // No key check needed — Pollinations (free, no key) is the automatic fallback

  const cfg        = { groqKey, grokKey, geminiKey, openAIKey };
  const isWorld    = scope !== "india";
  const locationList = isWorld ? WORLD_COUNTRIES.join(", ") : INDIA_STATES.join(", ");
  const scopeLabel   = isWorld ? "world countries" : "Indian states/UTs";

  // Base URL for internal fetch (needed since edge runtime can't use relative URLs)
  const origin = req.headers.get("origin") ?? req.nextUrl.origin;

  try {
    let rows: { location: string; value: number }[] | null = null;
    let name        = "";
    let description = "";
    let unit        = "";
    let explanation = "";
    let dataSource: "worldbank" | "ai-estimated" = "ai-estimated";
    let wbIndicatorId: string | null = null;
    let wbYear: number | null = null;

    // ── World scope: try to fetch real World Bank data ─────────────────
    if (isWorld) {
      const identified = await identifyWorldBankIndicator(prompt, cfg);

      if (identified) {
        const catalogue = LIVE_INDICATORS.find((i) => i.id === identified.indicatorId);
        const year      = catalogue?.defaultYear ?? 2022;

        const wbRows = await fetchWorldBankData(identified.indicatorId, year, origin);

        if (wbRows && wbRows.length >= 20) {
          rows           = wbRows;
          name           = identified.name;
          description    = catalogue?.description ?? identified.name;
          unit           = catalogue?.unit ?? identified.unit;
          explanation    = `Real data from World Bank Open Data (${year}). Indicator: ${identified.indicatorId}`;
          dataSource     = "worldbank";
          wbIndicatorId  = identified.indicatorId;
          wbYear         = year;
        }
      }
    }

    // ── Fall back to AI-estimated if WB data wasn't available ──────────
    if (!rows) {
      const aiResult = await generateAIEstimatedData(
        prompt, scope, locationList, scopeLabel, cfg
      );

      if (!aiResult.name || !aiResult.rows || !Array.isArray(aiResult.rows))
        return NextResponse.json({ error: "AI returned an invalid data structure" }, { status: 422 });

      rows        = aiResult.rows;
      name        = aiResult.name;
      description = aiResult.description;
      unit        = aiResult.unit ?? "";
      explanation = aiResult.explanation ?? "AI-estimated values";
      dataSource  = "ai-estimated";
    }

    return NextResponse.json({
      name,
      description,
      scope,
      unit,
      explanation,
      rows,
      _provider:    groqKey ? "groq" : grokKey ? "grok" : geminiKey ? "gemini" : openAIKey ? "openai" : "pollinations",
      _dataSource:  dataSource,
      _indicatorId: wbIndicatorId,
      _year:        wbYear,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
