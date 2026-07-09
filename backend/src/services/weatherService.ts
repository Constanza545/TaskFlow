/**
 * Integración con Open-Meteo: API pública y gratuita de clima, sin API key.
 * Docs: https://open-meteo.com/en/docs
 */

export interface WeatherDaily {
  date: string; // YYYY-MM-DD
  tmax: number;
  tmin: number;
  weatherCode: number;
  precipitationChance: number | null;
}

export interface WeatherReport {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    time: string;
  };
  daily: WeatherDaily[];
  source: string;
  sourceUrl: string;
  fetchedAt: string;
}

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, WeatherReport>();

interface GeoResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

async function geocode(city: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo geocoding respondió con status ${response.status}`);
  }
  const data = (await response.json()) as { results?: GeoResult[] };
  return data.results?.[0] ?? null;
}

export async function fetchWeather(city: string): Promise<WeatherReport | null> {
  const key = city.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MS) {
    return cached;
  }

  const place = await geocode(city);
  if (!place) return null;

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max',
    forecast_days: '7',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo forecast respondió con status ${response.status}`);
  }
  const data = (await response.json()) as {
    timezone: string;
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      weather_code: number;
      wind_speed_10m: number;
    };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      weather_code: number[];
      precipitation_probability_max: (number | null)[];
    };
  };

  const report: WeatherReport = {
    city: place.name,
    country: place.country ?? '',
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: data.timezone,
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      time: data.current.time,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      tmax: data.daily.temperature_2m_max[i],
      tmin: data.daily.temperature_2m_min[i],
      weatherCode: data.daily.weather_code[i],
      precipitationChance: data.daily.precipitation_probability_max[i] ?? null,
    })),
    source: 'Open-Meteo',
    sourceUrl: 'https://open-meteo.com/',
    fetchedAt: new Date().toISOString(),
  };

  cache.set(key, report);
  return report;
}
