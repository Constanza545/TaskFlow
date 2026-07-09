import { FormEvent, useState } from 'react';
import { useApiQuery } from '../hooks/useApiQuery';
import { Button, Card, Input } from '../components/ui';
import { WeatherReport } from '../types';
import { WeatherChart } from '../components/WeatherChart';

const PRESETS = ['Santiago', 'Buenos Aires', 'Lima', 'Madrid'];

// Códigos WMO usados por Open-Meteo → descripción en español
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Despejado', icon: '☀️' },
  1: { label: 'Mayormente despejado', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Niebla', icon: '🌫️' },
  48: { label: 'Niebla con escarcha', icon: '🌫️' },
  51: { label: 'Llovizna ligera', icon: '🌦️' },
  53: { label: 'Llovizna', icon: '🌦️' },
  55: { label: 'Llovizna intensa', icon: '🌦️' },
  61: { label: 'Lluvia ligera', icon: '🌧️' },
  63: { label: 'Lluvia', icon: '🌧️' },
  65: { label: 'Lluvia intensa', icon: '🌧️' },
  66: { label: 'Lluvia helada', icon: '🌧️' },
  67: { label: 'Lluvia helada intensa', icon: '🌧️' },
  71: { label: 'Nieve ligera', icon: '🌨️' },
  73: { label: 'Nieve', icon: '🌨️' },
  75: { label: 'Nieve intensa', icon: '❄️' },
  77: { label: 'Granos de nieve', icon: '❄️' },
  80: { label: 'Chubascos ligeros', icon: '🌧️' },
  81: { label: 'Chubascos', icon: '🌧️' },
  82: { label: 'Chubascos violentos', icon: '⛈️' },
  85: { label: 'Chubascos de nieve', icon: '🌨️' },
  86: { label: 'Chubascos de nieve intensos', icon: '🌨️' },
  95: { label: 'Tormenta', icon: '⛈️' },
  96: { label: 'Tormenta con granizo', icon: '⛈️' },
  99: { label: 'Tormenta con granizo fuerte', icon: '⛈️' },
};

function describe(code: number) {
  return WEATHER_CODES[code] ?? { label: `Código ${code}`, icon: '🌡️' };
}

const fmtDay = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' });

export function Weather() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Santiago');
  const { data: report, loading, error } = useApiQuery<WeatherReport>('/weather', { city });

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) setCity(query.trim());
  }

  const current = report ? describe(report.current.weatherCode) : null;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Clima</h2>
        <p className="text-sm text-gray-500">
          Condiciones actuales y pronóstico a 7 días desde la API pública de Open-Meteo.
        </p>
      </div>

      {/* Filtros en una sola fila, arriba del contenido que afectan */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            className="w-56"
            placeholder="Buscar ciudad..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button>Buscar</Button>
        </form>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setQuery('');
                setCity(p);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors ${
                report?.city === p || city === p
                  ? 'bg-brand-50 text-brand-700 ring-brand-200'
                  : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6 inline-block">
          {error}
        </p>
      )}
      {loading && !report && <p className="text-sm text-gray-400">Cargando clima...</p>}

      {report && (
        <div
          className={`grid grid-cols-1 lg:grid-cols-5 gap-6 items-start transition-opacity ${loading ? 'opacity-50' : ''}`}
        >
          {/* Condiciones actuales */}
          <Card
            className="lg:col-span-2"
            title={`${report.city}${report.country ? `, ${report.country}` : ''}`}
            subtitle={`Ahora mismo · zona horaria ${report.timezone}`}
          >
            <div className="flex items-center gap-4 mb-5">
              <span className="text-5xl" role="img" aria-label={current?.label}>
                {current?.icon}
              </span>
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {Math.round(report.current.temperature)}°C
                </div>
                <div className="text-sm text-gray-500">{current?.label}</div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#f7f6fb] rounded-xl p-3">
                <dt className="text-xs text-gray-500">Humedad</dt>
                <dd className="font-semibold text-gray-900">{report.current.humidity}%</dd>
              </div>
              <div className="bg-[#f7f6fb] rounded-xl p-3">
                <dt className="text-xs text-gray-500">Viento</dt>
                <dd className="font-semibold text-gray-900">{report.current.windSpeed} km/h</dd>
              </div>
            </dl>
          </Card>

          {/* Pronóstico 7 días */}
          <Card
            className="lg:col-span-3"
            title="Temperaturas de los próximos 7 días"
            subtitle="Máximas y mínimas diarias, en °C"
          >
            <WeatherChart daily={report.daily} />

            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                Ver datos en tabla
              </summary>
              <div className="mt-2 border border-gray-100 rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-2 py-1 font-medium">Día</th>
                      <th className="text-left px-2 py-1 font-medium">Condición</th>
                      <th className="text-right px-2 py-1 font-medium">Máx</th>
                      <th className="text-right px-2 py-1 font-medium">Mín</th>
                      <th className="text-right px-2 py-1 font-medium">Prob. lluvia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily.map((d) => {
                      const cond = describe(d.weatherCode);
                      return (
                        <tr key={d.date} className="border-t border-gray-100">
                          <td className="px-2 py-1 text-gray-600 capitalize">
                            {fmtDay.format(new Date(`${d.date}T00:00:00`))}
                          </td>
                          <td className="px-2 py-1 text-gray-600">
                            {cond.icon} {cond.label}
                          </td>
                          <td className="px-2 py-1 text-right font-medium text-gray-900">
                            {Math.round(d.tmax)}°
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {Math.round(d.tmin)}°
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600">
                            {d.precipitationChance !== null ? `${d.precipitationChance}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>

            <p className="text-xs text-gray-400 mt-3">
              Fuente:{' '}
              <a
                href={report.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-gray-600"
              >
                Open-Meteo
              </a>{' '}
              — API pública, sin API key. El backend cachea la respuesta 10 minutos por ciudad.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
