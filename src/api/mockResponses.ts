import { bienesMuebles } from '../data/bienes';
import { vehiculos } from '../data/vehiculos';
import { terrenos, protocolizaciones } from '../data/terrenos';
import { inmueblesList } from '../data/inmuebles';
import type { ApiBienesEstadisticas, ApiParcelasEstadisticas, ApiVehiculosEstadisticas } from './types';
import type { BienMueble } from '../types/bien';
import type { Vehiculo } from '../types/vehiculo';
import type { Terreno } from '../types/terreno';
import type { Inmueble } from '../types/inmueble';
import { listMeta } from './mockConfig';

type BienesQuery = { page?: number; limit?: number; search?: string };
type VehiculosQuery = { page?: number; limit?: number; search?: string };
type ParcelasQuery = {
  page?: number;
  limit?: number;
  search?: string;
  zona?: string;
  estado?: 'disponible' | 'comprometida' | 'desincorporada';
};

function countBy<T>(items: T[], keyFn: (item: T) => string): { estado: string; _count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || '—';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([estado, _count]) => ({ estado, _count }));
}

export const mockBienesEstadisticas: ApiBienesEstadisticas = {
  total: bienesMuebles.length,
  porEstadoUso: countBy(bienesMuebles, (b) => b.estadoUso).map(({ estado, _count }) => ({
    estado_uso: estado,
    _count,
  })),
  porCondicionFisica: countBy(bienesMuebles, (b) => b.condicionFisica).map(({ estado, _count }) => ({
    condicion_fisica: estado,
    _count,
  })),
  porConsumibilidad: [],
  perecederosVencidos: 0,
  valorTotal: bienesMuebles.reduce((s, b) => s + (b.valorAdquisicion ?? 0), 0),
};

export const mockVehiculosEstadisticas: ApiVehiculosEstadisticas = {
  total: vehiculos.length,
  porEstadoUso: countBy(vehiculos, (v) => v.estadoUso).map(({ estado, _count }) => ({
    estado_uso: estado,
    _count,
  })),
  porCondicionFisica: countBy(vehiculos, (v) => v.condicionFisica).map(({ estado, _count }) => ({
    condicion_fisica: estado,
    _count,
  })),
};

export const mockParcelasEstadisticas: ApiParcelasEstadisticas = {
  total: terrenos.length,
  porZona: countBy(terrenos, (t) => t.zona).map(({ estado, _count }) => ({
    zona: estado,
    _count,
  })),
  comprometidas: terrenos.filter((t) => t.areaComprometida > 0).length,
  desincorporadas: terrenos.filter((t) => t.areaDesincorporada > 0).length,
  disponibles: terrenos.filter((t) => t.areaDisponible > 0).length,
};

export function getMockBienes(query: BienesQuery = {}) {
  let list: BienMueble[] = [...bienesMuebles];
  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter(
      (b) =>
        b.codigoInterno.toLowerCase().includes(q) ||
        b.descripcion.toLowerCase().includes(q) ||
        b.marca.toLowerCase().includes(q) ||
        b.serial.toLowerCase().includes(q) ||
        b.ubicacion.toLowerCase().includes(q)
    );
  }
  const limit = query.limit ?? 100;
  const page = query.page ?? 1;
  const start = (page - 1) * limit;
  return {
    data: list.slice(start, start + limit),
    meta: listMeta(list.length, page, limit),
  };
}

export function getMockBienById(codigo: number): BienMueble {
  const bien = bienesMuebles.find((b) => b.id === codigo);
  if (!bien) throw new Error(`Bien mock ${codigo} no encontrado`);
  return bien;
}

export function getMockVehiculos(query: VehiculosQuery = {}) {
  let list: Vehiculo[] = [...vehiculos];
  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter(
      (v) =>
        v.codigoInterno.toLowerCase().includes(q) ||
        v.descripcion.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q)
    );
  }
  const limit = query.limit ?? 100;
  const page = query.page ?? 1;
  const start = (page - 1) * limit;
  return {
    data: list.slice(start, start + limit),
    meta: listMeta(list.length, page, limit),
  };
}

export function getMockVehiculoById(id: number): Vehiculo {
  const v = vehiculos.find((item) => item.id === id);
  if (!v) throw new Error(`Vehículo mock ${id} no encontrado`);
  return v;
}

export function getMockParcelas(query: ParcelasQuery = {}) {
  let terrenosList: Terreno[] = [...terrenos];
  if (query.search) {
    const q = query.search.toLowerCase();
    terrenosList = terrenosList.filter(
      (t) =>
        t.codigo.toLowerCase().includes(q) ||
        t.nombre.toLowerCase().includes(q) ||
        t.identificacion.toLowerCase().includes(q) ||
        t.ubicacion.toLowerCase().includes(q)
    );
  }
  if (query.zona) {
    terrenosList = terrenosList.filter((t) => t.zona === query.zona);
  }
  const limit = query.limit ?? 100;
  const page = query.page ?? 1;
  const start = (page - 1) * limit;
  const pageTerrenos = terrenosList.slice(start, start + limit);

  return {
    data: [] as never[],
    terrenos: pageTerrenos,
    inmuebles: inmueblesList,
    meta: listMeta(terrenosList.length, page, limit),
  };
}

export function getMockParcelaById(id: number) {
  const terreno = terrenos.find((t) => t.id === id);
  if (!terreno) throw new Error(`Parcela mock ${id} no encontrada`);
  const inmueble = inmueblesList.find((i) => i.id === id) ?? inmueblesList[0];
  const protocolos = protocolizaciones.filter((p) => p.terrenoId === id);
  return {
    raw: null,
    terreno,
    inmueble,
    protocolos,
  };
}
