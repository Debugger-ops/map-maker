import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  description: string;
  icon: string;
  humidity?: number;
  precipitation?: number;
  feelsLike?: number;
}

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0:  { description: "Clear sky", icon: "☀️" },
  1:  { description: "Mainly clear", icon: "🌤️" },
  2:  { description: "Partly cloudy", icon: "⛅" },
  3:  { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Icy fog", icon: "🌫️" },
  51: { description: "Light drizzle", icon: "🌦️" },
  53: { description: "Drizzle", icon: "🌦️" },
  55: { description: "Heavy drizzle", icon: "🌧️" },
  61: { description: "Light rain", icon: "🌧️" },
  63: { description: "Rain", icon: "🌧️" },
  65: { description: "Heavy rain", icon: "🌧️" },
  71: { description: "Light snow", icon: "🌨️" },
  73: { description: "Snow", icon: "❄️" },
  75: { description: "Heavy snow", icon: "❄️" },
  80: { description: "Rain showers", icon: "🌦️" },
  81: { description: "Showers", icon: "🌧️" },
  82: { description: "Heavy showers", icon: "⛈️" },
  85: { description: "Snow showers", icon: "🌨️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
  96: { description: "Thunderstorm + hail", icon: "⛈️" },
  99: { description: "Thunderstorm + hail", icon: "⛈️" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  let latitude: number, longitude: number;

  if (lat && lon) {
    latitude = parseFloat(lat);
    longitude = parseFloat(lon);
  } else if (name) {
    // Geocode the region name using Open-Meteo's free geocoding API
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    latitude = geoData.results[0].latitude;
    longitude = geoData.results[0].longitude;
  } else {
    return NextResponse.json({ error: "Provide name or lat/lon" }, { status: 400 });
  }

  try {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m` +
      `&timezone=auto`
    );

    if (!weatherRes.ok) return NextResponse.json({ error: "Weather fetch failed" }, { status: 502 });
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const code: number = current.weathercode ?? 0;
    const wmo = WMO_CODES[code] ?? { description: "Unknown", icon: "🌡️" };

    const result: WeatherData = {
      temperature: Math.round(current.temperature_2m ?? 0),
      windspeed: Math.round(current.windspeed_10m ?? 0),
      weathercode: code,
      description: wmo.description,
      icon: wmo.icon,
      humidity: current.relativehumidity_2m ?? undefined,
      precipitation: current.precipitation ?? 0,
      feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
    };

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
