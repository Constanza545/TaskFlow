/**
 * Integración con la API pública y gratuita de CoinGecko (no requiere API key).
 * Docs: https://www.coingecko.com/en/api/documentation
 */

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';

export interface CryptoPrice {
  id: string;
  usd: number;
  usd_24h_change: number;
}

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  const response = await fetch(COINGECKO_URL);
  if (!response.ok) {
    throw new Error(`CoinGecko respondió con status ${response.status}`);
  }
  const data = (await response.json()) as Record<string, { usd: number; usd_24h_change: number }>;

  return Object.entries(data).map(([id, values]) => ({
    id,
    usd: values.usd,
    usd_24h_change: values.usd_24h_change,
  }));
}

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  usd: number;
}

export interface CryptoHistory {
  coin: string;
  currency: 'usd';
  days: number;
  source: string;
  sourceUrl: string;
  points: HistoryPoint[];
  fetchedAt: string;
}

const HISTORY_DAYS = 30;
const HISTORY_CACHE_MS = 30 * 60 * 1000; // CoinGecko limita el plan gratuito; 30 min alcanza para datos diarios

let historyCache: CryptoHistory | null = null;

export async function fetchBitcoinHistory(): Promise<CryptoHistory> {
  if (historyCache && Date.now() - Date.parse(historyCache.fetchedAt) < HISTORY_CACHE_MS) {
    return historyCache;
  }

  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${HISTORY_DAYS}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (historyCache) return historyCache; // ante rate-limit, servir el último dato conocido
    throw new Error(`CoinGecko respondió con status ${response.status}`);
  }
  const data = (await response.json()) as { prices: [number, number][] };

  // La granularidad para 2-90 días es horaria: nos quedamos con el último precio de cada día
  const byDay = new Map<string, number>();
  for (const [ts, price] of data.prices) {
    byDay.set(new Date(ts).toISOString().slice(0, 10), price);
  }
  const points = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, usd]) => ({ date, usd: Math.round(usd) }));

  historyCache = {
    coin: 'bitcoin',
    currency: 'usd',
    days: HISTORY_DAYS,
    source: 'CoinGecko',
    sourceUrl: 'https://www.coingecko.com/es/monedas/bitcoin',
    points,
    fetchedAt: new Date().toISOString(),
  };
  return historyCache;
}
