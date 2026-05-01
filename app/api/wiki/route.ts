import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export interface WikiSummary {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
  coordinates?: { lat: number; lon: number };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "";
  const scope = searchParams.get("scope") ?? "world";

  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  // Try direct lookup first, then search
  const encode = (t: string) => encodeURIComponent(t.replace(/ /g, "_"));

  async function fetchSummary(t: string): Promise<WikiSummary | null> {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encode(t)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MapMaker/1.0 (educational project)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "disambiguation" || !data.extract) return null;
    return {
      title: data.title,
      extract: data.extract.slice(0, 500) + (data.extract.length > 500 ? "…" : ""),
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encode(t)}`,
      thumbnail: data.thumbnail?.source,
      coordinates: data.coordinates
        ? { lat: data.coordinates.lat, lon: data.coordinates.lon }
        : undefined,
    };
  }

  // Try variations: direct, then with state/country suffix
  const queries = [
    title,
    scope === "india" ? `${title} state` : `${title} country`,
    scope === "india" ? `${title}, India` : title,
  ];

  for (const q of queries) {
    const result = await fetchSummary(q);
    if (result) return NextResponse.json(result);
  }

  // Fallback: use Wikipedia search API
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&format=json&utf8=1&srlimit=1`,
      { headers: { "User-Agent": "MapMaker/1.0 (educational project)" } }
    );
    const searchData = await searchRes.json();
    const hit = searchData?.query?.search?.[0];
    if (hit) {
      const result = await fetchSummary(hit.title);
      if (result) return NextResponse.json(result);
    }
  } catch (_) {
    // ignore
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
