// Inmuebles / Parcelas — basado en data real (136 filas, muchos campos incompletos)

export type EstadoOcupacion = 'Disponible' | 'Ocupado' | 'Comprometido' | 'Desincorporado' | 'En litigio';
export type Zonificacion = 'Residencial' | 'Comercial' | 'Industrial' | 'Mixta' | 'Sin zonificar';
export type UsoActual = 'Vivienda' | 'Comercio' | 'Oficina' | 'Terreno baldío' | 'Equipamiento' | 'Sin uso' | 'Otro';

export interface Inmueble {
  id: number;
  ubicacion: string;
  areaSegunDocumento: number | null;   // m²
  areaDesincorporada: number | null;
  areaComprometida: number | null;
  areaDisponible: number | null;
  identificacionParcela: string;
  zonificacion: Zonificacion;
  estadoOcupacion: EstadoOcupacion;
  usoActual: UsoActual;
  linderos: string;
  coordenadas: string;
  datosRegistrales: string;
  proyecto: string;
  tipoInmueble: string;              // Apartamento, Casa, Terreno, Townhouse
  precio: number | null;
  observaciones: string;
}

// Catálogos
export const ESTADOS_OCUPACION: EstadoOcupacion[] = ['Disponible', 'Ocupado', 'Comprometido', 'Desincorporado', 'En litigio'];
export const ZONIFICACIONES: Zonificacion[] = ['Residencial', 'Comercial', 'Industrial', 'Mixta', 'Sin zonificar'];
export const USOS_ACTUALES: UsoActual[] = ['Vivienda', 'Comercio', 'Oficina', 'Terreno baldío', 'Equipamiento', 'Sin uso', 'Otro'];
export const TIPOS_INMUEBLE = ['Apartamento', 'Casa', 'Terreno', 'Townhouse', 'Local', 'Galpón'] as const;
