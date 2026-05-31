// Cementerio — inventario físico simple (304 filas reales) + gestión de parcelas

export type EstadoBienCementerio = 'Bueno' | 'Regular' | 'Dañado';
export type EstadoUsoCementerio = 'En uso' | 'En obsolescencia' | 'Obsoleto';

export type AreaCementerio =
  | 'Cocina' | 'Galpón' | 'Taller' | 'Oficinas'
  | 'Crematorio' | 'Sala Velatoria' | 'Patio'
  | 'Principal' | 'Sala de Espera' | 'Mantenimiento';

export type EstatusParcela = 'Disponible' | 'Ocupada' | 'Reservada' | 'Mantenimiento' | 'Vencida';
export type TipoParcela = 'Individual' | 'Familiar' | 'Nicho' | 'Osario' | 'Cremación';
export type FormaAdquisicionCementerio = 'Compra' | 'Donación' | 'Transferencia' | 'Asignación';
export type MonedaCementerio = 'Bs' | 'USD' | 'Bs.F';

export interface InventarioCementerio {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  color: string;
  serial: string;
  estadoBien: EstadoBienCementerio;
  area: AreaCementerio;
  sede: string;
  almacen: string;
  departamento: string;
  numeroDocumento: string;
  estadoUso: EstadoUsoCementerio;
  categoriaGeneral: string;
  subcategoria: string;
  categoriaEspecifica: string;
  fechaIngreso: string;
  formaAdquisicion: FormaAdquisicionCementerio;
  valorAdquisicion: number | null;
  moneda: MonedaCementerio;
  nombreProveedor: string;
  responsable: string;
  observaciones: string;
}

export interface ParcelaCementerio {
  id: number;
  identificacion: string;
  sector: string;
  tipo: TipoParcela;
  estatus: EstatusParcela;
  ocupante: string;
  fechaAsignacion: string;
  fechaVencimiento: string;
  contacto: string;
  observaciones: string;
}

// Catálogos
export const AREAS_CEMENTERIO: AreaCementerio[] = [
  'Cocina', 'Galpón', 'Taller', 'Oficinas', 'Crematorio',
  'Sala Velatoria', 'Patio', 'Principal', 'Sala de Espera', 'Mantenimiento',
];

export const ESTADOS_BIEN_CEMENTERIO: EstadoBienCementerio[] = ['Bueno', 'Regular', 'Dañado'];
export const ESTADOS_USO_CEMENTERIO: EstadoUsoCementerio[] = ['En uso', 'En obsolescencia', 'Obsoleto'];
export const SEDES_CEMENTERIO = ['Cementerio'] as const;
export const DEPARTAMENTOS_CEMENTERIO = [
  'Administración',
  'Crematorio',
  'Mantenimiento y Jardinería',
  'Sala Velatoria',
  'Servicios Generales',
] as const;
export const ESTATUS_PARCELA: EstatusParcela[] = ['Disponible', 'Ocupada', 'Reservada', 'Mantenimiento', 'Vencida'];
export const TIPOS_PARCELA: TipoParcela[] = ['Individual', 'Familiar', 'Nicho', 'Osario', 'Cremación'];
export const SECTORES_CEMENTERIO = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Sector E'] as const;
