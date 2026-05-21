// Bienes muebles / SUDEBIP — basado en data real extraída (1640 filas)

export type CondicionFisica = 'Bueno' | 'Regular' | 'Dañado' | 'Averiado' | 'Inservible';
export type EstadoUso = 'En uso' | 'En almacén' | 'En tránsito' | 'Desincorporado' | 'Por verificar';
export type EstatusCarga = 'Completo' | 'Parcial' | 'Pendiente' | 'Error';
export type FormaAdquisicion = 'Compra' | 'Donación' | 'Transferencia' | 'Asignación' | 'Comodato' | 'Desconocida';
export type MonedaBien = 'Bs' | 'USD' | 'Bs.F' | 'Bs.S';

export interface BienMueble {
  id: number;
  sede: string;
  unidadAdministrativa: string;
  codigoInterno: string;            // puede ser S/C, S/C/01, SC/161...
  sinCodigo: boolean;               // true si el código es S/C o variante
  descripcion: string;
  formaAdquisicion: FormaAdquisicion;
  fechaAdquisicion: string;         // ISO date o vacío
  numeroDocumento: string;
  moneda: MonedaBien;
  valorAdquisicion: number | null;
  estadoUso: EstadoUso;
  condicionFisica: CondicionFisica;
  marca: string;
  modelo: string;
  color: string;
  serial: string;
  sinSerial: boolean;               // true si serial es S/S
  categoriaGeneral: string;
  subcategoria: string;
  categoriaEspecifica: string;
  codigoCategoria: string;
  ubicacion: string;
  fuenteRegistro: string;           // "Maestro" | "Área" | archivo de origen
  estatusCarga: EstatusCarga;
  observaciones: string;
  creadoEn: string;
  actualizadoEn: string;
}

// Catálogos
export const SEDES = ['Sede Principal', 'Ciudad Bolívar', 'Puerto Ordaz', 'Cementerio Municipal'] as const;

export const UNIDADES_ADMINISTRATIVAS = [
  'Gerencia General', 'Administración', 'Almacén Central', 'Presidencia',
  'Recursos Humanos', 'Sistemas', 'Planificación', 'Consultoría Jurídica',
  'Gestión Comercial', 'Ingeniería', 'Mantenimiento',
] as const;

export const CATEGORIAS_GENERALES = [
  'Mobiliario de oficina', 'Equipos de computación', 'Equipos de comunicación',
  'Herramientas', 'Maquinaria', 'Equipos médicos', 'Equipos de seguridad',
  'Electrodomésticos', 'Equipos audiovisuales', 'Otros',
] as const;

export const CONDICIONES_FISICAS: CondicionFisica[] = ['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible'];
export const ESTADOS_USO: EstadoUso[] = ['En uso', 'En almacén', 'En tránsito', 'Desincorporado', 'Por verificar'];
export const ESTATUS_CARGA: EstatusCarga[] = ['Completo', 'Parcial', 'Pendiente', 'Error'];
export const FORMAS_ADQUISICION: FormaAdquisicion[] = ['Compra', 'Donación', 'Transferencia', 'Asignación', 'Comodato', 'Desconocida'];
export const MONEDAS: MonedaBien[] = ['Bs', 'USD', 'Bs.F', 'Bs.S'];
