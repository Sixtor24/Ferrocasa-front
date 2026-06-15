// Vehículos — basado en data real (5 registros, serial carrocería vacío en todos)

import type { FormaAdquisicion } from './bien';

export type CondicionVehiculo = 'Bueno' | 'Regular' | 'Dañado';
export type EstadoUsoVehiculo = 'En uso' | 'En obsolescencia' | 'Obsoleto';
export type EstatusCargaVehiculo = 'Completo' | 'Parcial' | 'Pendiente' | 'Error';

export interface Vehiculo {
  id: number | string;
  codigoInterno: string;
  descripcion: string;
  marca: string;
  modelo: string;
  color: string;
  almacen: string;
  sede: string;
  unidadAdministrativa: string;
  responsable: string;
  ciResponsable: string;
  proveedor: string;
  moneda: 'Bs' | 'USD' | 'EUR';
  fechaIngreso: string;
  fechaAdquisicion: string;
  numeroDocumento: string;
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
  categoriaEspecifica: string;
  codigoCategoria: string;
  formaAdquisicion: FormaAdquisicion;
  documentoAdquisicion: string;
  valorAdquisicion: number | null;
  estatusCarga: EstatusCargaVehiculo;
  observaciones: string;
}

// Catálogos
export const CONDICIONES_VEHICULO: CondicionVehiculo[] = ['Bueno', 'Regular', 'Dañado'];
export const ESTADOS_USO_VEHICULO: EstadoUsoVehiculo[] = ['En uso', 'En obsolescencia', 'Obsoleto'];
export const CATEGORIAS_VEHICULO = ['Sedan', 'Camioneta', 'Camión', 'Maquinaria pesada', 'Motocicleta', 'Autobús', 'Otro'] as const;
