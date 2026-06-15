// Bienes muebles / SUDEBIP — basado en data real extraída (1640 filas)

export type CondicionFisica = 'Bueno' | 'Regular' | 'Dañado' | 'Averiado' | 'Inservible';
export type EstadoUso = 'En uso' | 'En obsolescencia' | 'Obsoleto';
export type EstatusCarga = 'Completo' | 'Parcial' | 'Pendiente' | 'Error';
export type FormaAdquisicion = 'Compra' | 'Donación' | 'Transferencia' | 'Asignación' | 'Comodato' | 'Desconocida';
export type MonedaBien = 'Bs' | 'USD' | 'EUR';

export interface BienMueble {
  id: number;
  sede: string;
  unidadAdministrativa: string;
  responsable: string;
  ciResponsable: string;
  codigoInterno: string;            // puede ser S/C, S/C/01, SC/161...
  sinCodigo: boolean;               // true si el código es S/C o variante
  descripcion: string;
  formaAdquisicion: FormaAdquisicion;
  fechaAdquisicion: string;         // ISO date o vacío
  fechaIngreso: string;             // bien.fecha_ingreso
  fechaEgreso?: string;             // bien.fecha_egreso (vacío/ausente si sigue en inventario activo)
  numeroDocumento: string;
  nombreProveedor: string;
  cantidad: number | null;
  consumibilidad: string;
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
export const SEDES = ['Edificio Administrativo Ferrocasa', 'Área Externa', 'Cementerio'] as const;

export const UNIDADES_ADMINISTRATIVAS = [
  'Recepción', 'Gcia. de Talento Humano', 'Gcia. de Atención al Ciudadano',
  'Gcia. de Ingeniería y Construcción', 'Telemática', 'Cocina',
  'Unidad de Bienes Público', 'Coord. de Servicios Generales',
  'Gcia. de Administración y Finanzas', 'Sala de Juntas', 'Sala de Estar',
  'Presidencia', 'Vicepresidencia', 'Consultoría Jurídica', 'Auditoría Interna',
  'Imagen Institucional', 'Gcia. de Comercialización y Ventas',
  'Campaña de Guayana', 'Cementerio',
] as const;

export const CATEGORIAS_GENERALES = [
  'Mobiliario de oficina', 'Equipos de computación', 'Equipos de comunicación',
  'Herramientas', 'Maquinaria', 'Equipos médicos', 'Equipos de seguridad',
  'Electrodomésticos', 'Equipos audiovisuales', 'Otros',
] as const;

export const CONDICIONES_FISICAS: CondicionFisica[] = ['Bueno', 'Regular', 'Dañado'];
export const ESTADOS_USO: EstadoUso[] = ['En uso', 'En obsolescencia', 'Obsoleto'];
export const ESTATUS_CARGA: EstatusCarga[] = ['Completo', 'Parcial', 'Pendiente', 'Error'];
export const FORMAS_ADQUISICION: FormaAdquisicion[] = ['Compra', 'Donación', 'Transferencia', 'Asignación', 'Comodato', 'Desconocida'];
export const MONEDAS: MonedaBien[] = ['Bs', 'USD', 'EUR'];
