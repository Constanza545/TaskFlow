import { ReactNode } from 'react';

/**
 * Tarjeta estándar de la app: superficie blanca, esquinas amplias y sombra suave
 * (estilo admin dashboard). El `subtitle` se muestra como etiqueta de categoría
 * en mayúsculas sobre el título; `headerRight` coloca un indicador o acción a la derecha.
 */
export function Card({
  title,
  subtitle,
  headerRight,
  className = '',
  children,
}: {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-5 ${className}`}>
      {(title || subtitle || headerRight) && (
        <header className="mb-3">
          {subtitle && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              {subtitle}
            </p>
          )}
          <div className="flex items-center justify-between">
            {title && <h2 className="font-semibold text-gray-800">{title}</h2>}
            {headerRight}
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
