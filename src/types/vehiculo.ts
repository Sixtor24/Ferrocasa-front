// Vehículos — basado en data real (5 registros, serial carrocería vacío en todos)

export type CondicionVehiculo = 'Bueno' | 'Regular' | 'Dañado' | 'Averiado' | 'Inservible';
export type EstadoUsoVehiculo = 'En uso' | 'En taller' | 'Disponible' | 'Desincorporado' | 'Por verificar';
export type EstatusCargaVehiculo = 'Completo' | 'Parcial' | 'Pendiente' | 'Error';

export interface Vehiculo {
  id: number;
  codigoInterno: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabricacion: number | null;
  serialMotor: string;
  sinSerialMotor: boolean;
  serialCarroceria: string;
  sinSerialCarroceria: boolean;     // todos vacíos en data real
  placa: string;
  sinPlaca: boolean;                // S/P en data real
  condicionFisica: CondicionVehiculo;
  estadoUso: EstadoUsoVehiculo;
  categoriaGeneral: string;
  subcategoria: string;
  documentoAdquisicion: string;
  valorAdquisicion: number | null;
  estatusCarga: EstatusCargaVehiculo;
  observaciones: string;
}

// Catálogos
export const CONDICIONES_VEHICULO: CondicionVehiculo[] = ['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible'];
export const ESTADOS_USO_VEHICULO: EstadoUsoVehiculo[] = ['En uso', 'En taller', 'Disponible', 'Desincorporado', 'Por verificar'];
export const CATEGORIAS_VEHICULO = ['Sedan', 'Camioneta', 'Camión', 'Maquinaria pesada', 'Motocicleta', 'Autobús', 'Otro'] as const;
