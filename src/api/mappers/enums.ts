import type { CondicionFisica, EstadoUso } from '../../types/bien';
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

export function mapLevantamientoTopografico(api: string): 'Sí' | 'No' | 'En trámite' {
  if (api === 'Si') return 'Sí';
  if (api === 'Solicitar') return 'En trámite';
  return 'No';
}

export function mapAcreditacionAmbiental(api: string): 'Sí' | 'No' | 'En trámite' {
  if (api === 'Si_posee') return 'Sí';
  return 'No';
}

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
  const iso = value.split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return iso;
}
