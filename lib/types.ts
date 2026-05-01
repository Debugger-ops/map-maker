// Shared types for the Data-to-Map Visualizer

export type MapScope = "india" | "world";

export type VisualizationType = "choropleth" | "markers" | "heatmap";

/** A row of user data after parsing. */
export interface DataRow {
  /** A name we tried to match against a region (state or country). */
  location?: string;
  /** Optional latitude (used for marker / heatmap viz). */
  lat?: number;
  /** Optional longitude (used for marker / heatmap viz). */
  lng?: number;
  /** The numeric value used for color / size encoding. */
  value: number;
  /** A short label shown in tooltips (defaults to `location`). */
  label?: string;
  /** Anything else from the source row, kept for tooltips. */
  extra?: Record<string, string | number | null>;
}

/** A dataset that the app knows how to draw. */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  scope: MapScope;
  /** What kind of visualization fits best by default. */
  visualization: VisualizationType;
  /** Units (e.g. "USD", "%", "people / km²"). */
  unit?: string;
  /** The actual rows. */
  rows: DataRow[];
  /** Whether this dataset was supplied by the user (vs. preloaded). */
  userProvided?: boolean;
}

/** Outcome of auto-detecting columns in a CSV/JSON upload. */
export interface DetectedColumns {
  locationCol?: string;
  latCol?: string;
  lngCol?: string;
  valueCol?: string;
  labelCol?: string;
}

/** Info passed to onHover callback from the map. */
export interface HoverInfo {
  name: string;
  value: number | null;
  unit?: string;
}

/** Color scale palette identifier. */
export type Palette =
  | "blues"
  | "reds"
  | "greens"
  | "viridis"
  | "magma"
  | "plasma"
  | "diverging";

/** Map tile style identifier. */
export type TileStyle =
  | "osm"
  | "osm-dark"
  | "google-road"
  | "google-satellite"
  | "google-hybrid"
  | "esri-satellite"
  | "esri-topo";

/** Info about a clicked/selected region. */
export interface SelectedRegion {
  name: string;
  value: number | null;
  unit?: string;
}
