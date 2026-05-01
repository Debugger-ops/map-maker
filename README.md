# Map Maker — Data‑to‑Map Visualizer

A production‑ready Next.js (App Router) + TypeScript + Tailwind app that turns
any tabular dataset into an interactive map.

- **India** state‑level and **World** country‑level maps
- Three visualization modes: **Choropleth**, **Markers**, **Heatmap**
- Upload **CSV / JSON**, paste **manual** data, or pick from **preloaded** datasets
  (population, GDP, poverty rate, KFC / Domino's outlets, density, …)
- Auto‑detects `location` / `lat` / `lng` / `value` columns
- Color‑scale legend, hover tooltips, search highlighting
- **Compare** two datasets on the same map (hover shows both values)
- **Light / Dark** theme
- **Download** the current map as a PNG

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (utility classes only — no separate CSS modules)
- Leaflet + react-leaflet (interactive map)
- Leaflet.heat (heatmap layer)
- Papaparse (robust CSV parsing)
- html-to-image (PNG export)
- world-atlas + datameet/maps (boundary data, simplified with mapshaper)

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

For a production build:

```bash
npm run build
npm run start
```

## Project layout

```
app/
  layout.tsx          # Root layout, fonts, theme
  page.tsx            # Main app shell (sidebar + map + panels)
  globals.css         # Tailwind + Leaflet tooltip theming
components/
  MapView.tsx         # Leaflet map (client-only via next/dynamic)
  Sidebar.tsx         # Controls: scope, dataset, viz, palette, search, compare
  Legend.tsx          # Color-scale legend
  InfoPanel.tsx       # Dataset stats + hover details
  DataUpload.tsx      # File upload + manual input
  ThemeToggle.tsx     # Light/dark switch
lib/
  types.ts            # Shared types
  datasets.ts         # Preloaded India + World datasets
  parseData.ts        # CSV/JSON parsing, column detection, name normalization
  colorScales.ts      # Color palette helpers
public/
  data/
    india-states.geojson      # India state polygons (256 KB simplified)
    world-countries.geojson   # World country polygons (128 KB simplified)
  samples/                    # Sample CSV / JSON to try out
```

## Bring your own data

Any of these formats Just Work — column names are auto‑detected:

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

Region names are normalized — `Delhi` → `NCT of Delhi`,
`USA` → `United States of America`, `Orissa` → `Odisha`, etc.

## Sample datasets included

`public/samples/` contains:

- `india-population.csv`
- `india-kfc-outlets.csv`  (uses lat/lng → marker map)
- `world-gdp.csv`
- `world-population.json`

## How it works

1. The selected dataset's rows are normalized to a `{ location, value, lat?, lng? }` shape.
2. A name → value map is built and joined against the loaded GeoJSON
   (`ST_NM` for India, `name` for World).
3. The `Leaflet GeoJSON` layer is styled with a color function derived from the
   dataset's min / max and the chosen palette.
4. For marker maps, each row becomes a `CircleMarker` whose radius and color
   reflect the value. For heatmaps, points feed into `leaflet.heat`.
5. When you upload a file, Papaparse runs in the browser, the detected columns
   show up in the upload card, and you immediately see the result on the map.

## Caveats

- The bundled India GeoJSON is a simplified version (`mapshaper -simplify 3%`)
  for fast loading; not for cartographically precise work.
- Preloaded numeric values are illustrative — replace with authoritative data
  for production use.
- Map → PNG export uses `html-to-image`; map tiles served from a different
  origin sometimes refuse to embed. If the export fails, give it a moment and
  retry, or switch to the dark/light theme that uses different tile servers.

## License

MIT — boundary data (Natural Earth + datameet/maps) is in the public domain.
