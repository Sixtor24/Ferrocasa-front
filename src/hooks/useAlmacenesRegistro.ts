import { useEffect, useState } from 'react';
import { fetchAlmacenesAll } from '../api/services/almacenes.service';
import type { ApiAlmacen } from '../api/types';

/** Almacenes con responsable anidado; se refrescan al abrir modales de registro. */
export function useAlmacenesRegistro(open: boolean) {
  const [almacenes, setAlmacenes] = useState<ApiAlmacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAlmacenesAll()
      .then((res) => {
        if (!cancelled) setAlmacenes(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setAlmacenes([]);
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los almacenes');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return { almacenes, loading, error };
}
