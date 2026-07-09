export type Role = 'admin' | 'miembro' | 'invitado';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  details: string | null;
  created_at: string;
}

export interface CryptoPrice {
  id: string;
  usd: number;
  usd_24h_change: number;
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
