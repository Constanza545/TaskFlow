import { KeyboardEvent, PointerEvent, useMemo, useState } from 'react';
import { useApiQuery } from '../hooks/useApiQuery';
import { Card } from './ui';
import { CryptoHistory } from '../types';

// Cromática del gráfico: serie validada contra superficie blanca (contraste >= 3:1),
// texto y ejes siempre en tinta neutra — nunca en el color de la serie.
const SERIES = '#9333ea';
const GRID = '#e1e0d9';
const BASELINE = '#c3c2b7';
const MUTED = '#898781';

// El viewBox se acerca al ancho real de la tarjeta (~500px) para que el texto no se deforme al escalar
const W = 460;
const H = 240;
const M = { top: 18, right: 14, bottom: 26, left: 46 };

const fmtUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const fmtDay = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

function formatDate(iso: string): string {
  return fmtDay.format(new Date(`${iso}T00:00:00`));
}

/** Paso "redondo" (1/2/5 × 10^n) para ticks limpios en el eje Y */
function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(rough));
  const n = rough / pow;
  return (n >= 5 ? 10 : n >= 2 ? 5 : 1) * pow;
}

export function MarketChart() {
  const { data: history, loading, error } = useApiQuery<CryptoHistory>('/crypto/history');
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (!history || history.points.length < 2) return null;
    const values = history.points.map((p) => p.usd);
    const step = niceStep((Math.max(...values) - Math.min(...values)) / 3 || 1);
    const yMin = Math.floor(Math.min(...values) / step) * step;
    const yMax = Math.ceil(Math.max(...values) / step) * step;

    const x = (i: number) => M.left + (i / (history.points.length - 1)) * (W - M.left - M.right);
    const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * (H - M.top - M.bottom);

    const ticks: number[] = [];
    for (let t = yMin; t <= yMax; t += step) ticks.push(t);

    const line = history.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.usd)}`).join(' ');
    const area = `${line} L${x(history.points.length - 1)},${H - M.bottom} L${x(0)},${H - M.bottom} Z`;

    const n = history.points.length;
    const xTicks = [0, Math.round(n / 3), Math.round((2 * n) / 3), n - 1];

    return { x, y, ticks, line, area, xTicks };
  }, [history]);

  function pickIndex(e: PointerEvent<SVGSVGElement>) {
    if (!history) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (xView - M.left) / (W - M.left - M.right);
    const i = Math.round(ratio * (history.points.length - 1));
    setHover(Math.max(0, Math.min(history.points.length - 1, i)));
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    if (!history) return;
    const last = history.points.length - 1;
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1));
    else if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? 0) + 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  }

  const lastPoint = history?.points[history.points.length - 1];
  const hovered = hover !== null && history ? history.points[hover] : null;

  return (
    <Card title="Bitcoin, precio de cierre diario" subtitle="Últimos 30 días, en dólares (USD)">
      {error && !history && <p className="text-sm text-gray-400">{error}</p>}
      {loading && !history && <p className="text-sm text-gray-400">Cargando datos...</p>}

      {history && geo && lastPoint && (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto block focus:outline-none"
            role="img"
            aria-label={`Precio de Bitcoin de los últimos ${history.days} días. Último cierre: ${fmtUsd.format(lastPoint.usd)}`}
            tabIndex={0}
            onPointerMove={pickIndex}
            onPointerLeave={() => setHover(null)}
            onKeyDown={onKeyDown}
          >
            {/* Gridlines horizontales + ticks del eje Y */}
            {geo.ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke={GRID} strokeWidth="1" />
                <text
                  x={M.left - 6}
                  y={geo.y(t) + 3.5}
                  textAnchor="end"
                  fontSize="10.5"
                  fill={MUTED}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {t >= 1000 ? `${t / 1000}K` : t.toLocaleString('en-US')}
                </text>
              </g>
            ))}

            {/* Ticks del eje X (fechas) */}
            {geo.xTicks.map((i) => (
              <text
                key={i}
                x={geo.x(i)}
                y={H - 8}
                textAnchor={i === 0 ? 'start' : i === history.points.length - 1 ? 'end' : 'middle'}
                fontSize="10.5"
                fill={MUTED}
              >
                {formatDate(history.points[i].date)}
              </text>
            ))}

            {/* Lavado de área + línea de la serie */}
            <path d={geo.area} fill={SERIES} opacity="0.1" />
            <path d={geo.line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Punto final con anillo de superficie + etiqueta directa del último valor */}
            <circle cx={geo.x(history.points.length - 1)} cy={geo.y(lastPoint.usd)} r="4" fill={SERIES} stroke="#ffffff" strokeWidth="2" />
            {/* Halo de superficie (paint-order) para que la etiqueta no choque con la línea */}
            <text
              x={geo.x(history.points.length - 1) - 4}
              y={geo.y(lastPoint.usd) - 12}
              textAnchor="end"
              fontSize="11"
              fontWeight="600"
              fill="#0b0b0b"
              stroke="#ffffff"
              strokeWidth="3"
              style={{ paintOrder: 'stroke' }}
            >
              {fmtUsd.format(lastPoint.usd)}
            </text>

            {/* Crosshair: hairline vertical que ancla al dato más cercano */}
            {hovered && hover !== null && (
              <g pointerEvents="none">
                <line x1={geo.x(hover)} x2={geo.x(hover)} y1={M.top} y2={H - M.bottom} stroke={BASELINE} strokeWidth="1" />
                <circle cx={geo.x(hover)} cy={geo.y(hovered.usd)} r="4.5" fill={SERIES} stroke="#ffffff" strokeWidth="2" />
              </g>
            )}
          </svg>

          {/* Tooltip: el valor manda, la fecha acompaña */}
          {hovered && hover !== null && (
            <div
              className="absolute pointer-events-none bg-white ring-1 ring-gray-900/10 shadow-md rounded-md px-2.5 py-1.5"
              style={{
                left: `${(geo.x(hover) / W) * 100}%`,
                top: `${(geo.y(hovered.usd) / H) * 100}%`,
                transform: `translate(${hover > history.points.length * 0.75 ? '-110%' : '10%'}, -120%)`,
              }}
            >
              <div className="text-sm font-semibold text-gray-900">{fmtUsd.format(hovered.usd)}</div>
              <div className="text-xs text-gray-500">{formatDate(hovered.date)}</div>
            </div>
          )}
        </div>
      )}

      {history && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
            Ver datos en tabla
          </summary>
          <div className="max-h-48 overflow-y-auto mt-2 border border-gray-100 rounded">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-2 py-1 font-medium">Fecha</th>
                  <th className="text-right px-2 py-1 font-medium">Cierre (USD)</th>
                </tr>
              </thead>
              <tbody>
                {history.points.map((p) => (
                  <tr key={p.date} className="border-t border-gray-100">
                    <td className="px-2 py-1 text-gray-600">{p.date}</td>
                    <td className="px-2 py-1 text-right text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtUsd.format(p.usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Fuente:{' '}
        <a
          href={history?.sourceUrl ?? 'https://www.coingecko.com'}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-gray-600"
        >
          CoinGecko
        </a>{' '}
        — API pública, sin API key. El backend cachea la respuesta 30 minutos.
      </p>
    </Card>
  );
}
