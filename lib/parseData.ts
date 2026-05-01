// CSV / JSON parsing + column auto-detection + name normalization.

import Papa from "papaparse";
import type { DataRow, DetectedColumns } from "./types";

/* -------------------- Auto-detection of columns -------------------- */

const LOCATION_HINTS = [
  "state",
  "country",
  "region",
  "province",
  "name",
  "location",
  "place",
  "city",
  "district",
  "code",
  "iso",
  "admin",
];
const VALUE_HINTS = [
  "value",
  "count",
  "total",
  "amount",
  "rate",
  "gdp",
  "population",
  "density",
  "score",
  "index",
  "outlets",
  "stores",
  "poverty",
  "income",
  "metric",
];
const LAT_HINTS = ["lat", "latitude", "y"];
const LNG_HINTS = ["lng", "long", "longitude", "lon", "x"];

function header(field: string) {
  return field.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickByHint(fields: string[], hints: string[]): string | undefined {
  const lowered = fields.map((f) => header(f));
  // exact-match first
  for (const h of hints) {
    const i = lowered.findIndex((f) => f === h);
    if (i >= 0) return fields[i];
  }
  // contains
  for (const h of hints) {
    const i = lowered.findIndex((f) => f.includes(h));
    if (i >= 0) return fields[i];
  }
  return undefined;
}

export function detectColumns(
  fields: string[],
  rows: Record<string, unknown>[]
): DetectedColumns {
  const detected: DetectedColumns = {};
  detected.latCol = pickByHint(fields, LAT_HINTS);
  detected.lngCol = pickByHint(fields, LNG_HINTS);
  detected.locationCol = pickByHint(
    fields.filter((f) => f !== detected.latCol && f !== detected.lngCol),
    LOCATION_HINTS
  );
  detected.valueCol = pickByHint(fields, VALUE_HINTS);

  // Fallback: pick first numeric column for value, first string column for location.
  if (!detected.valueCol) {
    detected.valueCol = fields.find((f) => {
      const v = rows[0]?.[f];
      return typeof v === "number" || (!isNaN(Number(v)) && v !== "" && v !== null);
    });
  }
  if (!detected.locationCol) {
    detected.locationCol = fields.find(
      (f) =>
        f !== detected.valueCol &&
        f !== detected.latCol &&
        f !== detected.lngCol &&
        typeof rows[0]?.[f] === "string"
    );
  }
  return detected;
}

/* -------------------- Name normalization -------------------- */

const ALIAS_MAP: Record<string, string> = {
  // India state aliases -> our canonical state names (matches geojson ST_NM).
  delhi: "NCT of Delhi",
  "new delhi": "NCT of Delhi",
  "andaman and nicobar": "Andaman & Nicobar Island",
  "andaman and nicobar islands": "Andaman & Nicobar Island",
  "andaman & nicobar islands": "Andaman & Nicobar Island",
  "arunachal pradesh": "Arunanchal Pradesh",
  "dadra and nagar haveli": "Dadara & Nagar Havelli",
  "dadra & nagar haveli": "Dadara & Nagar Havelli",
  "daman and diu": "Daman & Diu",
  "jammu and kashmir": "Jammu & Kashmir",
  "j&k": "Jammu & Kashmir",
  pondicherry: "Puducherry",
  orissa: "Odisha",
  uttaranchal: "Uttarakhand",

  // World aliases -> world-atlas country names (Natural Earth 50m).
  "united states": "United States of America",
  usa: "United States of America",
  us: "United States of America",
  "u.s.a.": "United States of America",
  "u.s.": "United States of America",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  russia: "Russia",
  "russian federation": "Russia",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  "north korea": "North Korea",
  "dem. rep. korea": "North Korea",
  "ivory coast": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  burma: "Myanmar",
  czechia: "Czechia",
  "czech republic": "Czechia",
  uae: "United Arab Emirates",
  "viet nam": "Vietnam",
};

export function normalizeName(name: string | undefined | null): string {
  if (!name) return "";
  const trimmed = String(name).trim();
  const key = trimmed.toLowerCase();
  if (ALIAS_MAP[key]) return ALIAS_MAP[key];
  return trimmed;
}

/* -------------------- Building DataRow[] from raw rows -------------------- */

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[, %]/g, "").trim();
    if (cleaned === "") return NaN;
    const n = Number(cleaned);
    return isNaN(n) ? NaN : n;
  }
  return NaN;
}

export function buildRows(
  rows: Record<string, unknown>[],
  cols: DetectedColumns
): DataRow[] {
  const out: DataRow[] = [];
  for (const r of rows) {
    const value = cols.valueCol ? toNumber(r[cols.valueCol]) : NaN;
    if (!isFinite(value)) continue;

    const lat = cols.latCol ? toNumber(r[cols.latCol]) : NaN;
    const lng = cols.lngCol ? toNumber(r[cols.lngCol]) : NaN;

    const rawLoc = cols.locationCol ? r[cols.locationCol] : undefined;
    const location = rawLoc ? normalizeName(String(rawLoc)) : undefined;

    const labelRaw = cols.labelCol ? r[cols.labelCol] : undefined;
    const label = labelRaw ? String(labelRaw) : location;

    const extra: Record<string, string | number | null> = {};
    for (const k of Object.keys(r)) {
      if (
        k === cols.locationCol ||
        k === cols.valueCol ||
        k === cols.latCol ||
        k === cols.lngCol ||
        k === cols.labelCol
      )
        continue;
      const v = r[k];
      if (v === undefined || v === null) extra[k] = null;
      else if (typeof v === "number") extra[k] = v;
      else extra[k] = String(v);
    }

    out.push({
      location,
      lat: isFinite(lat) ? lat : undefined,
      lng: isFinite(lng) ? lng : undefined,
      value,
      label,
      extra,
    });
  }
  return out;
}

/* -------------------- Top-level parse -------------------- */

export interface ParseResult {
  rows: DataRow[];
  detected: DetectedColumns;
  fields: string[];
}

export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  const fields = result.meta.fields ?? [];
  const detected = detectColumns(fields, result.data);
  const rows = buildRows(result.data, detected);
  return { rows, detected, fields };
}

export function parseJSON(text: string): ParseResult {
  const parsed = JSON.parse(text);
  const arr: Record<string, unknown>[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data)
    ? parsed.data
    : Array.isArray(parsed?.rows)
    ? parsed.rows
    : [];
  const fields = arr.length ? Object.keys(arr[0]) : [];
  const detected = detectColumns(fields, arr);
  const rows = buildRows(arr, detected);
  return { rows, detected, fields };
}

/** Stats useful for legend, normalization. */
export function stats(rows: DataRow[]) {
  if (rows.length === 0)
    return { min: 0, max: 0, mean: 0, count: 0 };
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const r of rows) {
    if (!isFinite(r.value)) continue;
    if (r.value < min) min = r.value;
    if (r.value > max) max = r.value;
    sum += r.value;
  }
  return { min, max, mean: sum / rows.length, count: rows.length };
}
