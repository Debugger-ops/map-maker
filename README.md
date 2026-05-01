# Map Maker — AI-Powered Data-to-Map Visualizer

A production-ready Next.js (App Router) + TypeScript + Tailwind app that turns any dataset into a beautiful interactive map — with built-in AI generation, live real-world data, and zero required API keys.

- **India** state-level and **World** country-level maps
- Three visualization modes: **Choropleth**, **Markers**, **Heatmap**
- **AI Map Builder** — describe any topic in plain English and get a fully populated map
- **Live Data Browser** — one-click real data from World Bank (world) and Census/NFHS/NITI Aayog (India states)
- Upload **CSV / JSON**, paste **manual** data, or pick from **preloaded** datasets
- Auto-detects `location` / `lat` / `lng` / `value` columns
- Color-scale legend, hover tooltips, search highlighting
- **Compare** two datasets on the same map (hover shows both values)
- **Light / Dark** theme
- **Download** the current map as a PNG or export data as CSV

## AI providers — all free options included

The app works out of the box with **zero setup** — no API key needed.

| Provider | Cost | Key required | How to get |
|---|---|---|---|
| **Pollinations AI** ✨ | Free forever | ❌ None | Built-in, always works |
| **Groq** ⚡ (recommended) | Free | ✅ Free key | [console.groq.com/keys](https://console.groq.com/keys) |
| **Google Gemini** | Free | ✅ Free key | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Grok (xAI)** | $25 free credit | ✅ Key needed | [console.x.ai](https://console.x.ai) |
| **OpenAI GPT-4o mini** | Paid | ✅ Key needed | [platform.openai.com](https://platform.openai.com/api-keys) |

Provider priority: Groq → Grok → Gemini → OpenAI → Pollinations (auto fallback).

Keys are stored only in your browser — never sent to any server except the chosen AI provider.

### Server-side key (optional)

Set one of these environment variables to pre-configure AI for all users without requiring personal keys:

```env
GROQ_API_KEY=gsk_…
GROK_API_KEY=xai-…
GEMINI_API_KEY=AIzaSy…
OPENAI_API_KEY=sk-…
```

## Live Data Browser

Click any indicator to load real data directly onto the map — no manual upload needed.

**World indicators (33 total, via World Bank Open Data — free, no key):**
- Economy: GDP, GDP per capita, GNI, inflation, FDI, trade, exports…
- Population: total, density, urban share, growth rate…
- Health: life expectancy, infant mortality, physicians, sanitation…
- Education: literacy, primary enrolment, secondary enrolment…
- Environment: CO₂ emissions, forest area, renewable energy…
- Technology: internet users, mobile subscriptions, R&D spend…
- Governance: Gini index, ease of doing business, rule of law…

**India state indicators (22 total, from authoritative Indian sources):**
- Economy: GSDP, GDP per capita, poverty headcount, unemployment, agriculture share
- Population: total, density, urban share, sex ratio
- Health: life expectancy, infant mortality, stunting prevalence, anaemia in women
- Education: literacy rate, female literacy, school dropout rate
- Environment: forest cover, groundwater exploitation
- Governance: HDI, SDG Index score, crime rate

Sources: Census 2011/2021, NFHS-5 (2019–21), MOSPI GSDP 2022–23, NITI Aayog SDG Index 2023–24, PLFS 2022–23, RBI State Finances, NCRB 2022, FSI 2021, CGWB 2022.

## AI Map Builder

Type any topic — "literacy rates across Indian states", "CO₂ emissions by country", "unemployment in South Asia" — and the AI will:

1. Identify the best matching World Bank indicator (for world maps)
2. Fetch real data from World Bank Open Data
3. Fall back to AI-estimated values if live data is unavailable
4. Render a fully labelled choropleth, marker, or heatmap on the map

Maps generated from real World Bank data show a **Real Data** badge.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (utility classes only)
- Leaflet + react-leaflet (interactive map)
- Leaflet.heat (heatmap layer)
- Papaparse (CSV parsing)
- html-to-image (PNG export)
- world-atlas + datameet/maps (boundary GeoJSON, simplified)

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

For a production build:

```bash
npm run build
npm run start
```

## Project layout

```
app/
  layout.tsx                  # Root layout, fonts, theme
  page.tsx                    # Main app shell (sidebar + map + panels)
  globals.css                 # Tailwind + Leaflet tooltip theming
  api/
    ai/
      generate/route.ts       # AI map generation (two-step: WB indicator → real data → AI fallback)
      describe/route.ts       # AI region detail descriptions
      status/route.ts         # Reports active provider + capabilities
    worldbank/route.ts        # Edge proxy for World Bank Open Data API
    india-data/route.ts       # Curated India state-level datasets (22 indicators)
components/
  MapView.tsx                 # Leaflet map (client-only via next/dynamic)
  Sidebar.tsx                 # All controls: scope, dataset, viz, palette, search, compare
  AIAssistant.tsx             # AI Map Builder UI
  LiveDataBrowser.tsx         # Live Data Browser (scope-aware: India + World)
  RegionDetailPanel.tsx       # Hover/click region details with AI descriptions
  Legend.tsx                  # Color-scale legend
  InfoPanel.tsx               # Dataset stats + hover values
  DataUpload.tsx              # File upload + manual input
  SettingsPanel.tsx           # API key management
  ThemeToggle.tsx             # Light/dark switch
lib/
  types.ts                    # Shared types (Dataset, MapScope, etc.)
  datasets.ts                 # Preloaded India + World datasets
  parseData.ts                # CSV/JSON parsing, column detection, name normalization
  colorScales.ts              # Color palette helpers
  liveIndicators.ts           # Catalogue of 55 live indicators (world + india, all categories)
  aiProvider.ts               # Multi-provider AI client (Groq/Grok/Gemini/OpenAI/Pollinations)
public/
  data/
    india-states.geojson      # India state polygons (simplified)
    world-countries.geojson   # World country polygons (simplified)
  samples/                    # Sample CSV / JSON files
```

## Bring your own data

Column names are auto-detected. Any of these formats work:

**CSV (region values):**
```csv
location,value
Maharashtra,124.4
Bihar,124.8
West Bengal,99.7
```

**CSV (lat/lng for marker / heatmap maps):**
```csv
city,latitude,longitude,outlets
Mumbai,19.076,72.8777,75
Delhi,28.6139,77.209,95
```

**JSON:**
```json
[
  { "country": "Germany", "gdp_b": 4460 },
  { "country": "India",   "gdp_b": 3940 }
]
```

Region names are normalized automatically — `Delhi` → `NCT of Delhi`, `USA` → `United States of America`, `Orissa` → `Odisha`, `Korea, Rep.` → `South Korea`, etc.

## How it works

1. The selected dataset's rows are normalized to a `{ location, value, lat?, lng? }` shape.
2. A name → value map is built and joined against the loaded GeoJSON (`ST_NM` for India, `name` for World).
3. The `Leaflet GeoJSON` layer is styled with a color function derived from the dataset's min/max and the chosen palette.
4. For marker maps, each row becomes a `CircleMarker` whose radius and color reflect the value. For heatmaps, points feed into `leaflet.heat`.
5. AI generation calls the `/api/ai/generate` route which (for world scope) identifies the best World Bank indicator, fetches real data, then falls back to AI-estimated values if needed.
6. Live Data Browser calls `/api/worldbank` (world) or `/api/india-data` (India) and immediately adds the result as a new user dataset.

## Caveats

- The bundled India GeoJSON is a simplified version (`mapshaper -simplify 3%`) for fast loading — not for cartographically precise work.
- India state dataset values are from the most recent authoritative surveys (2019–23); some states may have older data due to reporting delays.
- Map → PNG export uses `html-to-image`; tiles from cross-origin servers sometimes refuse to embed. If export fails, switch tile style and retry.
- World Bank data availability varies by indicator and year — the proxy returns the closest available year automatically.

## License

MIT — boundary data (Natural Earth + datameet/maps) is in the public domain.
