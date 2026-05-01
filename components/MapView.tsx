"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import L from "leaflet";

import type {
  Dataset,
  HoverInfo,
  MapScope,
  Palette,
  TileStyle,
  VisualizationType,
} from "@/lib/types";
import { makeColorFn } from "@/lib/colorScales";
import { normalizeName, stats } from "@/lib/parseData";
import { formatNumber } from "@/lib/format";
import "leaflet/dist/leaflet.css";

interface Props {
  scope: MapScope;
  dataset: Dataset | null;
  visualization: VisualizationType;
  palette: Palette;
  search: string;
  isDark: boolean;
  tileStyle: TileStyle;
  googleMapsKey: string;
  onHover?: (info: HoverInfo | null) => void;
  onRegionClick?: (info: { name: string; value: number | null; unit?: string }) => void;
}

const INDIA_GEOJSON_URL = "/data/india-states.geojson";
const WORLD_GEOJSON_URL = "/data/world-countries.geojson";

function getTileConfig(style: TileStyle, isDark: boolean) {
  switch (style) {
    case "google-road":
      return {
        url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        subdomains: "0123",
        attr: "Map data &copy;2024 Google",
        maxZoom: 20,
      };
    case "google-satellite":
      return {
        url: "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        subdomains: "0123",
        attr: "Imagery &copy;2024 Google",
        maxZoom: 20,
      };
    case "google-hybrid":
      return {
        url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        subdomains: "0123",
        attr: "Map data &amp; Imagery &copy;2024 Google",
        maxZoom: 20,
      };
    case "esri-satellite":
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr: "Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye",
        maxZoom: 18,
        subdomains: "abc",
      };
    case "esri-topo":
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attr: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        maxZoom: 18,
        subdomains: "abc",
      };
    case "osm-dark":
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attr: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 20,
        subdomains: "abcd",
      };
    case "osm":
    default:
      return isDark
        ? {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attr: "&copy; OpenStreetMap &copy; CARTO",
            maxZoom: 20,
            subdomains: "abcd",
          }
        : {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attr: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
            subdomains: "abc",
          };
  }
}

function getRegionName(scope: MapScope, props: GeoJsonProperties): string {
  if (!props) return "";
  if (scope === "india") return String(props.ST_NM ?? props.NAME_1 ?? "");
  return String(props.name ?? props.NAME ?? props.ADMIN ?? "");
}

function ViewController({ scope }: { scope: MapScope }) {
  const map = useMap();
  useEffect(() => {
    if (scope === "india") {
      map.setView([22.5, 80.5], 5);
    } else {
      map.setView([20, 0], 2);
    }
  }, [scope, map]);
  return null;
}

function HeatLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap();
  useEffect(() => {
    let layer: L.Layer | null = null;
    let cancelled = false;
    (async () => {
      // @ts-expect-error: side-effect plugin attaches to L.heatLayer
      await import("leaflet.heat");
      if (cancelled) return;
      // @ts-expect-error: heatLayer is added by the plugin
      layer = L.heatLayer(points, { radius: 28, blur: 22, maxZoom: 10 }).addTo(map);
    })();
    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

export default function MapView({
  scope,
  dataset,
  visualization,
  palette,
  search,
  isDark,
  tileStyle,
  googleMapsKey: _googleMapsKey,
  onHover,
  onRegionClick,
}: Props) {
  const [geo, setGeo] = useState<{ scope: MapScope; data: FeatureCollection } | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(scope === "india" ? INDIA_GEOJSON_URL : WORLD_GEOJSON_URL)
      .then((r) => r.json())
      .then((g) => { if (!cancelled) setGeo({ scope, data: g }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [scope]);

  const geojson = geo && geo.scope === scope ? geo.data : null;

  const valueByName = useMemo(() => {
    const m = new Map<string, number>();
    if (!dataset) return m;
    for (const r of dataset.rows) {
      if (r.location) m.set(normalizeName(r.location).toLowerCase(), r.value);
    }
    return m;
  }, [dataset]);

  const { min, max } = useMemo(() => {
    if (!dataset) return { min: 0, max: 0 };
    return stats(dataset.rows);
  }, [dataset]);

  const colorFn = useMemo(() => makeColorFn(palette, min, max), [palette, min, max]);

  const isSatellite =
    tileStyle === "google-satellite" ||
    tileStyle === "google-hybrid" ||
    tileStyle === "esri-satellite";

  const styleFeature = useMemo(() => {
    return (feat?: Feature<Geometry, GeoJsonProperties>): PathOptions => {
      const name = feat ? getRegionName(scope, feat.properties) : "";
      const v = valueByName.get(name.toLowerCase());
      const isMatch =
        search && name.toLowerCase().includes(search.toLowerCase()) && search.length > 1;
      return {
        weight: isMatch ? 2.5 : isSatellite ? 1.2 : 0.8,
        color: isMatch ? "#f59e0b" : isSatellite ? "#ffffff" : isDark ? "#374151" : "#9ca3af",
        opacity: 1,
        fillColor:
          v !== undefined
            ? colorFn(v)
            : isSatellite
            ? "transparent"
            : isDark
            ? "#1f2937"
            : "#e5e7eb",
        fillOpacity: visualization === "choropleth" ? (isSatellite ? 0.45 : 0.85) : 0.15,
      };
    };
  }, [colorFn, valueByName, isDark, scope, search, visualization, isSatellite]);

  const onEachFeature = useMemo(() => {
    return (feat: Feature<Geometry, GeoJsonProperties>, layer: Layer) => {
      const name = getRegionName(scope, feat.properties);
      const v = valueByName.get(name.toLowerCase());
      const tip = `<div style="font-weight:600;margin-bottom:2px">${escapeHtml(name)}</div>${
        v !== undefined
          ? `<div>${formatNumber(v)}${dataset?.unit ? " " + escapeHtml(dataset.unit) : ""}</div>`
          : `<div style="opacity:.7">no data · click for details</div>`
      }`;
      layer.bindTooltip(tip, { sticky: true, direction: "auto" });
      layer.on({
        mouseover: () => {
          (layer as L.Path).setStyle({ weight: 2.5, color: "#f59e0b" });
          onHover?.({ name, value: v ?? null, unit: dataset?.unit });
        },
        mouseout: () => {
          geoLayerRef.current?.resetStyle(layer as L.Path);
          onHover?.(null);
        },
        click: (e) => {
          onRegionClick?.({ name, value: v ?? null, unit: dataset?.unit });
          const map = (e.target as L.Path & { _map?: L.Map })._map;
          const target = e.target as { getBounds?: () => L.LatLngBounds };
          if (map && target.getBounds) {
            map.fitBounds(target.getBounds(), { padding: [20, 20] });
          }
        },
      });
    };
  }, [scope, valueByName, dataset, onHover, onRegionClick]);

  const markerPoints = useMemo(() => {
    if (!dataset) return [];
    return dataset.rows.filter((r) => r.lat !== undefined && r.lng !== undefined);
  }, [dataset]);

  const heatPoints = useMemo<[number, number, number][]>(() => {
    return markerPoints.map((r) => {
      const t = max === min ? 0.5 : (r.value - min) / (max - min);
      return [r.lat as number, r.lng as number, Math.max(0.1, t)];
    });
  }, [markerPoints, max, min]);

  const tileConfig = getTileConfig(tileStyle, isDark);

  return (
    <MapContainer
      center={[22.5, 80.5]}
      zoom={5}
      minZoom={2}
      maxZoom={tileConfig.maxZoom ?? 18}
      worldCopyJump
      scrollWheelZoom
      zoomControl={false}
      style={{ width: "100%", height: "100%", background: isDark ? "#0b1120" : "#f9fafb" }}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        key={`${tileStyle}-${isDark}`}
        attribution={tileConfig.attr}
        url={tileConfig.url}
        subdomains={tileConfig.subdomains ?? "abc"}
        maxZoom={tileConfig.maxZoom ?? 18}
      />
      <ViewController scope={scope} />

      {(visualization === "choropleth" || visualization === "markers") && geojson && (
        <GeoJSON
          key={`${scope}-${dataset?.id ?? "none"}-${palette}-${visualization}-${isDark}-${tileStyle}`}
          data={geojson}
          style={styleFeature}
          onEachFeature={onEachFeature}
          ref={(r) => { geoLayerRef.current = r; }}
        />
      )}

      {visualization === "markers" &&
        markerPoints.map((p, i) => {
          const t = max === min ? 0.5 : (p.value - min) / (max - min);
          return (
            <CircleMarker
              key={i}
              center={[p.lat as number, p.lng as number]}
              radius={6 + t * 22}
              pathOptions={{ color: "#fff", weight: 1.5, fillColor: colorFn(p.value), fillOpacity: 0.85 }}
              eventHandlers={{
                mouseover: () =>
                  onHover?.({ name: p.label ?? p.location ?? "", value: p.value, unit: dataset?.unit }),
                mouseout: () => onHover?.(null),
                click: () =>
                  onRegionClick?.({ name: p.label ?? p.location ?? "", value: p.value, unit: dataset?.unit }),
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} sticky>
                <div style={{ fontWeight: 600 }}>{p.label ?? p.location ?? ""}</div>
                <div>{formatNumber(p.value)}{dataset?.unit ? " " + dataset.unit : ""}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}

      {visualization === "heatmap" && heatPoints.length > 0 && (
        <HeatLayer points={heatPoints} />
      )}
    </MapContainer>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
