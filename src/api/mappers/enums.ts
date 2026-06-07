import type { CondicionFisica, EstadoUso, FormaAdquisicion } from '../../types/bien';
import type { CondicionVehiculo, EstadoUsoVehiculo } from '../../types/vehiculo';

export function mapEstadoUsoBien(api: string): EstadoUso {
  const map: Record<string, EstadoUso> = {
    En_Uso: 'En uso',
    En_Reparacion: 'En obsolescencia',
    Dado_de_Baja: 'Obsoleto',
    Almacenado: 'En uso',
  };
  return map[api] ?? 'En uso';
}

export function mapEstadoUsoVehiculo(api: string): EstadoUsoVehiculo {
  return mapEstadoUsoBien(api) as EstadoUsoVehiculo;
}

export function mapCondicionFisica(api: string): CondicionFisica {
  const map: Record<string, CondicionFisica> = {
    Bueno: 'Bueno',
    Regular: 'Regular',
    Dañado: 'Dañado',
    Averiado: 'Dañado',
    Inservible: 'Dañado',
  };
  return map[api] ?? 'Regular';
}

export function mapCondicionVehiculo(api: string): CondicionVehiculo {
  return mapCondicionFisica(api) as CondicionVehiculo;
}

export type EstadoVehiculoApi =
  | 'Carga_Parcial'
  | 'Carga_Completa'
  | 'En_Mantenimiento'
  | 'Disponible'
  | 'Asignado';

export function normalizeEstadoVehiculoApi(value?: string | null): EstadoVehiculoApi {
  if (value === 'Carga_Total' || value === 'Carga_Completa') return 'Carga_Completa';
  if (value === 'Carga_Parcial') return 'Carga_Parcial';
  if (value === 'En_Mantenimiento') return 'En_Mantenimiento';
  if (value === 'Disponible') return 'Disponible';
  if (value === 'Asignado') return 'Asignado';
  return 'Carga_Completa';
}

export function mapLevantamientoTopografico(api: string): 'Sí' | 'En trámite' {
  if (api === 'Si') return 'Sí';
  return 'En trámite';
}

export function levantamientoTopograficoToApi(value: 'Sí' | 'En trámite'): 'Si' | 'Solicitar' {
  return value === 'Sí' ? 'Si' : 'Solicitar';
}

export function mapAcreditacionAmbiental(api: string): 'Sí' | 'No' | 'En trámite' {
  if (api === 'Si_posee') return 'Sí';
  return 'No';
}

export function mapFormaAdquisicion(api?: string | null): FormaAdquisicion {
  const map: Record<string, FormaAdquisicion> = {
    Compra: 'Compra',
    Donacion: 'Donación',
    Confiscacion: 'Confiscación',
  };
  return map[api ?? ''] ?? 'Desconocida';
}

export function isSinCodigoBien(codigo: string): boolean {
  const normalizado = codigo.trim().toUpperCase();
  return (
    normalizado.length === 0 ||
    normalizado === 'S/C' ||
    normalizado === 'S/C/' ||
    normalizado === 'SC' ||
    normalizado.startsWith('SC/')
  );
}

export { isSinSerialBien } from '../../utils/serialBien';

export function mapMoneda(api?: string | null): 'Bs' | 'USD' | 'EUR' {
  if (api === 'USD') return 'USD';
  if (api === 'EUR') return 'EUR';
  return 'Bs';
}

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function toIsoDate(value?: string | null): string {
  if (!value || value === '—') return '';
  const trimmed = String(value).trim();

  const head = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed.split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(head) && !Number.isNaN(new Date(head).getTime())) {
    return head;
  }

  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    if (!Number.isNaN(new Date(iso).getTime())) return iso;
  }

  return '';
}

/** Fecha de formulario (YYYY-MM-DD) → ISO datetime para POST/PUT del API. */
export function toApiDateTime(value?: string | null): string | undefined {
  const iso = toIsoDate(value);
  if (!iso) return undefined;
  return `${iso}T12:00:00.000Z`;
}
