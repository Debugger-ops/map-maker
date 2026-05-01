import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Maps World Bank country names → GeoJSON / app country names
 * so data lines up with the map polygons.
 */
const WB_TO_APP: Record<string, string> = {
  "United States":                   "United States of America",
  "Russian Federation":              "Russia",
  "Korea, Rep.":                     "South Korea",
  "Korea, Dem. People's Rep.":       "North Korea",
  "Iran, Islamic Rep.":              "Iran",
  "Egypt, Arab Rep.":                "Egypt",
  "Viet Nam":                        "Vietnam",
  "Syrian Arab Republic":            "Syria",
  "Lao PDR":                         "Laos",
  "Congo, Dem. Rep.":                "Dem. Rep. Congo",
  "Congo, Rep.":                     "Republic of Congo",
  "Venezuela, RB":                   "Venezuela",
  "Yemen, Rep.":                     "Yemen",
  "Kyrgyz Republic":                 "Kyrgyzstan",
  "Slovak Republic":                 "Slovakia",
  "Czech Republic":                  "Czechia",
  "Eswatini":                        "Swaziland",
  "North Macedonia":                 "Macedonia",
  "Cabo Verde":                      "Cape Verde",
  "São Tomé and Principe":           "Sao Tome and Principe",
  "Timor-Leste":                     "East Timor",
  "Micronesia, Fed. Sts.":           "Micronesia",
  "West Bank and Gaza":              "Palestine",
  "Bahamas, The":                    "Bahamas",
  "Gambia, The":                     "Gambia",
  "Tanzania":                        "Tanzania",
  "Côte d'Ivoire":                   "Ivory Coast",
  "Bosnia and Herzegovina":          "Bosnia and Herz.",
  "Central African Republic":        "Central African Rep.",
  "Equatorial Guinea":               "Eq. Guinea",
  "Dominican Republic":              "Dominican Rep.",
  "South Sudan":                     "S. Sudan",
};

export interface WorldBankRow {
  country: string;
  value: number | null;
  year: string;
}

export interface WorldBankResponse {
  indicatorId: string;
  indicatorName: string;
  unit: string;
  year: string;
  rows: WorldBankRow[];
  source: string;
}

/**
 * GET /api/worldbank?indicator=NY.GDP.MKTP.CD&year=2022
 *
 * Proxies World Bank API (free, no key required).
 * Returns rows mapped to app country names.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const indicator = searchParams.get("indicator");
  const year      = searchParams.get("year") ?? "2022";

  if (!indicator) {
    return NextResponse.json({ error: "Missing indicator parameter" }, { status: 400 });
  }

  try {
    // World Bank API — free, no key needed
    // mrv=1 means "most recent value", per_page=300 covers all countries
    const url = `https://api.worldbank.org/v2/country/all/indicator/${encodeURIComponent(indicator)}?format=json&date=${year}&per_page=300&mrv=1`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      // 10-second timeout via signal
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `World Bank API error: ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();

    // World Bank wraps data: [meta, dataArray]
    if (!Array.isArray(json) || json.length < 2) {
      return NextResponse.json({ error: "Unexpected World Bank response format" }, { status: 502 });
    }

    const meta      = json[0];
    const dataArray = json[1] as Array<{
      indicator: { id: string; value: string };
      country:   { id: string; value: string };
      value:     string | null;
      date:      string;
    }>;

    if (!Array.isArray(dataArray)) {
      return NextResponse.json({ error: "No data returned from World Bank" }, { status: 404 });
    }

    // Build rows — skip aggregate regions (iso codes like "1W", "4E", etc.)
    const SKIP_PREFIXES = /^[0-9]/;
    const rows: WorldBankRow[] = [];

    for (const d of dataArray) {
      if (SKIP_PREFIXES.test(d.country.id)) continue;
      if (d.value === null || d.value === "") continue;

      const numVal = parseFloat(d.value);
      if (isNaN(numVal)) continue;

      const rawName = d.country.value;
      const mappedName = WB_TO_APP[rawName] ?? rawName;

      rows.push({
        country: mappedName,
        value:   numVal,
        year:    d.date,
      });
    }

    // Derive the most common year in the data (mrv=1 returns mixed years)
    const yearCounts: Record<string, number> = {};
    for (const r of rows) yearCounts[r.year] = (yearCounts[r.year] ?? 0) + 1;
    const dominantYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? year;

    const indicatorName: string = dataArray[0]?.indicator?.value ?? indicator;

    const response: WorldBankResponse = {
      indicatorId:   indicator,
      indicatorName,
      unit:          "", // caller fills in from catalogue
      year:          dominantYear,
      rows,
      source:        `World Bank Open Data · ${url}`,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 1 hour
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
