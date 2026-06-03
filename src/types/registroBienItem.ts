import type { ConsumibilidadBienApi } from '../api/services/bienes.service';
import type { CondicionFisica, EstadoUso, MonedaBien } from './bien';

export type MonedaRegistro = MonedaBien;

export const MONEDAS_REGISTRO: MonedaRegistro[] = ['Bs', 'USD', 'EUR'];

export type ItemRegistroDraft = {
  key: string;
  codigoInterno: string;
  descripcion: string;
  color: string;
  cantidad: number;
  unidadAdministrativa: string;
  responsable: string;
  ciResponsable: string;
  idCategoriaGeneral: number;
  categoriaGeneralNombre: string;
  idSubcategoria: number;
  subcategoriaNombre: string;
  idCategoriaEspecifica: number;
  categoriaEspecificaNombre: string;
  estadoUso: EstadoUso;
  serial: string;
  sinSerial: boolean;
  marca: string;
  modelo: string;
  valorAdquisicion: number;
  almacen: string;
  observaciones: string;
  consumibilidad: ConsumibilidadBienApi;
  condicionFisica: CondicionFisica;
};

export type DocumentoRegistroDraft = {
  numeroDocumento: string;
  nombreProveedor: string;
  fechaAdquisicion: string;
  formaAdquisicion: 'Compra' | 'Donacion' | 'Confiscacion';
  sede: string;
  moneda: MonedaBien;
};

export type RegistroBienesModulo = 'administrativo' | 'cementerio';
