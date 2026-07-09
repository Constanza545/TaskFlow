import { KeyboardEvent, PointerEvent, useMemo, useState } from 'react';
import { WeatherDaily } from '../types';

// Par categórico máx/mín validado contra superficie blanca (contraste >= 3:1, ΔE CVD 74.6)
const MAX_COLOR = '#e34948';
const MIN_COLOR = '#2a78d6';
const GRID = '#e1e0d9';
const BASELINE = '#c3c2b7';
const MUTED = '#898781';

const W = 460;
const H = 230;
const M = { top: 18, right: 14, bottom: 26, left: 34 };

const fmtDay = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric' });

function formatDate(iso: string): string {
  return fmtDay.format(new Date(`${iso}T00:00:00`));
}

/** Paso "redondo" para ticks limpios del eje de temperatura */
function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(rough || 1));
  const n = rough / pow;
  return (n >= 5 ? 10 : n >= 2 ? 5 : 1) * pow;
}

export function WeatherChart({ daily }: { daily: WeatherDaily[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (daily.length < 2) return null;
    const values = daily.flatMap((d) => [d.tmax, d.tmin]);
    const step = niceStep((Math.max(...values) - Math.min(...values)) / 3 || 1);
    const yMin = Math.floor(Math.min(...values) / step) * step;
    const yMax = Math.ceil(Math.max(...values) / step) * step;

    const x = (i: number) => M.left + (i / (daily.length - 1)) * (W - M.left - M.right);
    const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * (H - M.top - M.bottom);

    const ticks: number[] = [];
    for (let t = yMin; t <= yMax; t += step) ticks.push(t);

    const path = (get: (d: WeatherDaily) => number) =>
      daily.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(get(d))}`).join(' ');

    return { x, y, ticks, maxLine: path((d) => d.tmax), minLine: path((d) => d.tmin) };
  }, [daily]);

  function pickIndex(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (xView - M.left) / (W - M.left - M.right);
    const i = Math.round(ratio * (daily.length - 1));
    setHover(Math.max(0, Math.min(daily.length - 1, i)));
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const last = daily.length - 1;
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1));
    else if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? 0) + 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  }

  if (!geo) return null;
  const hovered = hover !== null ? daily[hover] : null;

  return (
    <div className="relative">
      {/* Leyenda: claves de línea, texto siempre en tinta */}
      <div className="flex items-center gap-4 mb-1">
        {[
          { label: 'Máxima', color: MAX_COLOR },
          { label: 'Mínima', color: MIN_COLOR },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg width="14" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="14" y2="2" stroke={s.color} strokeWidth="2" strokeLinecap="round" />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block focus:outline-none"
        role="img"
        aria-label={`Pronóstico de temperaturas máximas y mínimas para los próximos ${daily.length} días`}
        tabIndex={0}
        onPointerMove={pickIndex}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
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
              {t}°
            </text>
          </g>
        ))}

        {daily.map((d, i) => (
          <text
            key={d.date}
            x={geo.x(i)}
            y={H - 8}
            textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}
            fontSize="10.5"
            fill={MUTED}
          >
            {formatDate(d.date)}
          </text>
        ))}

        <path d={geo.maxLine} fill="none" stroke={MAX_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={geo.minLine} fill="none" stroke={MIN_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Marcadores con anillo de superficie */}
        {daily.map((d, i) => (
          <g key={d.date}>
            <circle cx={geo.x(i)} cy={geo.y(d.tmax)} r="4" fill={MAX_COLOR} stroke="#ffffff" strokeWidth="2" />
            <circle cx={geo.x(i)} cy={geo.y(d.tmin)} r="4" fill={MIN_COLOR} stroke="#ffffff" strokeWidth="2" />
          </g>
        ))}

        {hovered && hover !== null && (
          <line
            pointerEvents="none"
            x1={geo.x(hover)}
            x2={geo.x(hover)}
            y1={M.top}
            y2={H - M.bottom}
            stroke={BASELINE}
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Tooltip: ambas series en el día apuntado; el valor manda */}
      {hovered && hover !== null && (
        <div
          className="absolute pointer-events-none bg-white ring-1 ring-gray-900/10 shadow-md rounded-md px-2.5 py-1.5"
          style={{
            left: `${(geo.x(hover) / W) * 100}%`,
            top: '12%',
            transform: `translate(${hover > daily.length * 0.6 ? '-110%' : '10%'}, 0)`,
          }}
        >
          <div className="text-xs text-gray-500 mb-0.5">{formatDate(hovered.date)}</div>
          {[
            { value: hovered.tmax, label: 'Máx', color: MAX_COLOR },
            { value: hovered.tmin, label: 'Mín', color: MIN_COLOR },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-1.5">
              <svg width="12" height="4" aria-hidden="true">
                <line x1="0" y1="2" x2="12" y2="2" stroke={row.color} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">{Math.round(row.value)}°</span>
              <span className="text-xs text-gray-500">{row.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
