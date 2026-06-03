import type { BienPayload, CondicionFisicaBienApi, EstadoUsoBienApi } from '../api/services/bienes.service';
import type { MonedaDocumento } from '../api/services/documentos.service';
import type { ItemRegistroDraft } from '../types/registroBienItem';
import type { CondicionFisica, EstadoUso } from '../types/bien';
import type { MonedaRegistro } from '../types/registroBienItem';

export function monedaBienToDocumento(moneda: MonedaRegistro): MonedaDocumento {
  if (moneda === 'USD') return 'USD';
  if (moneda === 'EUR') return 'EUR';
  return 'VES';
}

export function estadoUsoToApi(estado: EstadoUso): EstadoUsoBienApi {
  if (estado === 'En uso') return 'En_Uso';
  if (estado === 'Obsoleto') return 'Dado_de_Baja';
  return 'En_Reparacion';
}

export function condicionFisicaToApi(condicion: CondicionFisica): CondicionFisicaBienApi {
  if (condicion === 'Regular') return 'Regular';
  if (condicion === 'Dañado') return 'Dañado';
  return 'Bueno';
}

export function itemRegistroToBienPayload(
  item: ItemRegistroDraft,
  params: { idDoc: number; fechaIngreso: string; idAlmacen: number },
): BienPayload {
  const sinSerial = item.sinSerial || !item.serial.trim() || item.serial.trim().toUpperCase() === 'S/S';

  return {
    descripcion: item.descripcion.trim(),
    id_doc: params.idDoc,
    fecha_ingreso: params.fechaIngreso,
    fecha_egreso: null,
    valor_adquisicion: item.valorAdquisicion,
    marca: item.marca.trim(),
    modelo: item.modelo.trim() || null,
    color: item.color.trim() || null,
    material: null,
    serial: sinSerial ? null : item.serial.trim(),
    estado_uso: estadoUsoToApi(item.estadoUso),
    condicion_fisica: condicionFisicaToApi(item.condicionFisica),
    id_almacen: params.idAlmacen,
    cantidad: item.cantidad,
    consumibilidad: item.consumibilidad,
    usuario_carga: null,
    id_categoria_especifica: item.idCategoriaEspecifica,
    unidad_administrativa: item.unidadAdministrativa,
    observaciones: item.observaciones.trim() || null,
  };
}

export function normalizeCatalogValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
