import type { CondicionFisica, EstadoUso } from '../../types/bien';
import type { CondicionVehiculo, EstadoUsoVehiculo } from '../../types/vehiculo';

export function mapEstadoUsoBien(api: string): EstadoUso {
  const map: Record<string, EstadoUso> = {
    En_Uso: 'En uso',
    En_Reparacion: 'En almacén',
    Dado_de_Baja: 'Desincorporado',
    Almacenado: 'En almacén',
  };
  return map[api] ?? 'Por verificar';
}

export function mapEstadoUsoVehiculo(api: string): EstadoUsoVehiculo {
  const map: Record<string, EstadoUsoVehiculo> = {
    En_Uso: 'En uso',
    En_Reparacion: 'En taller',
    Dado_de_Baja: 'Desincorporado',
    Almacenado: 'Disponible',
  };
  return map[api] ?? 'Por verificar';
}

export function mapCondicionFisica(api: string): CondicionFisica {
  const map: Record<string, CondicionFisica> = {
    Bueno: 'Bueno',
    Regular: 'Regular',
    Dañado: 'Dañado',
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

export function mapMoneda(api?: string | null): 'Bs' | 'USD' | 'Bs.F' | 'Bs.S' {
  if (api === 'USD') return 'USD';
  if (api === 'EUR') return 'USD';
  return 'Bs';
}

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function toIsoDate(value?: string | null): string {
  if (!value) return '';
  return value.split('T')[0];
}
