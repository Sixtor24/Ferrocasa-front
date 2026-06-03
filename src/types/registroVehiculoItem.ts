import type { MonedaBien } from './bien';
import type { CondicionVehiculo, EstadoUsoVehiculo } from './vehiculo';

export type ItemVehiculoRegistroDraft = {
  key: string;
  codigoInterno: string;
  placa: string;
  descripcion: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabricacion: number;
  serialMotor: string;
  serialCarroceria: string;
  cantidad: number;
  valorAdquisicion: number;
  unidadAdministrativa: string;
  responsable: string;
  ciResponsable: string;
  almacen: string;
  idCategoriaGeneral: number;
  categoriaGeneralNombre: string;
  idSubcategoria: number;
  subcategoriaNombre: string;
  idCategoriaEspecifica: number;
  categoriaEspecificaNombre: string;
  estadoUso: EstadoUsoVehiculo;
  condicionFisica: CondicionVehiculo;
  observaciones: string;
};

export type DocumentoVehiculoRegistroDraft = {
  numeroDocumento: string;
  nombreProveedor: string;
  fechaAdquisicion: string;
  formaAdquisicion: 'Compra' | 'Donacion' | 'Confiscacion';
  sede: string;
  moneda: MonedaBien;
};
