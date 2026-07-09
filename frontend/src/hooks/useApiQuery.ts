import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';

/**
 * Consulta GET a la API con estado de carga/error, cancelación y refetch.
 * Conserva los datos anteriores mientras recarga (o si la recarga falla),
 * para que la UI mantenga el contenido visible en vez de parpadear.
 */
export function useApiQuery<T>(url: string, params?: Record<string, string | number>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Serializado para que un objeto nuevo con el mismo contenido no re-dispare el efecto
  const paramsKey = JSON.stringify(params ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const parsed = JSON.parse(paramsKey) as Record<string, string | number> | null;
    api
      .get<T>(url, parsed ? { params: parsed } : undefined)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err) ?? 'No se pudo cargar la información');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, paramsKey, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, refetch };
}
