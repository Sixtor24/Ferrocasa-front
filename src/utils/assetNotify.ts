import { toast } from 'sonner';
import type { BienMueble } from '../types/bien';
import type { Vehiculo } from '../types/vehiculo';
import type { ItemRegistroDraft } from '../types/registroBienItem';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';

export function formatBienResumen(
  bien: Pick<BienMueble, 'descripcion' | 'marca' | 'codigoInterno' | 'sinCodigo'>,
) {
  const descripcion = bien.descripcion?.trim() || 'Bien';
  const marca = bien.marca?.trim();
  const codigo = bien.sinCodigo ? '' : bien.codigoInterno?.trim();
  const titulo = marca && marca !== '—' ? `${descripcion} · ${marca}` : descripcion;
  return codigo ? `${titulo} (cód. ${codigo})` : titulo;
}

export function formatVehiculoResumen(
  vehiculo: Pick<Vehiculo, 'descripcion' | 'marca' | 'placa' | 'sinPlaca' | 'codigoInterno'>,
) {
  const descripcion = vehiculo.descripcion?.trim() || 'Vehículo';
  const marca = vehiculo.marca?.trim();
  const placa = vehiculo.sinPlaca ? '' : vehiculo.placa?.trim();
  const titulo = marca && marca !== '—' ? `${descripcion} · ${marca}` : descripcion;
  if (placa) return `${titulo} (placa ${placa})`;
  if (vehiculo.codigoInterno?.trim()) return `${titulo} (cód. ${vehiculo.codigoInterno.trim()})`;
  return titulo;
}

export function notifyBienActualizado(
  bien: Pick<BienMueble, 'descripcion' | 'marca' | 'codigoInterno' | 'sinCodigo'>,
  cambios: { estadoUso?: string; condicionFisica?: string },
) {
  const partes: string[] = [];
  if (cambios.estadoUso) partes.push(`estado actualizado a «${cambios.estadoUso}»`);
  if (cambios.condicionFisica) partes.push(`condición física: «${cambios.condicionFisica}»`);

  toast.success('Cambio guardado', {
    description: `${formatBienResumen(bien)} — ${partes.join(' · ')}.`,
  });
}

export function notifyVehiculoActualizado(
  vehiculo: Pick<Vehiculo, 'descripcion' | 'marca' | 'placa' | 'sinPlaca' | 'codigoInterno'>,
  estadoUso: string,
) {
  toast.success('Cambio guardado', {
    description: `${formatVehiculoResumen(vehiculo)} — estado actualizado a «${estadoUso}».`,
  });
}

export function notifyBienTransferido(
  bien: Pick<BienMueble, 'descripcion' | 'marca' | 'codigoInterno' | 'sinCodigo'>,
  almacenDestino: string,
) {
  toast.success('Transferencia realizada', {
    description: `${formatBienResumen(bien)} — movido a «${almacenDestino}».`,
  });
}

export function notifyBienRetirado(
  bien: Pick<BienMueble, 'descripcion' | 'marca' | 'codigoInterno' | 'sinCodigo'>,
) {
  toast.success('Retirado del inventario', {
    description: `${formatBienResumen(bien)} — dado de baja con fecha de egreso de hoy.`,
  });
}

export function notifyVehiculoTransferido(
  vehiculo: Pick<Vehiculo, 'descripcion' | 'marca' | 'placa' | 'sinPlaca' | 'codigoInterno'>,
  almacenDestino: string,
) {
  toast.success('Transferencia realizada', {
    description: `${formatVehiculoResumen(vehiculo)} — movido a «${almacenDestino}».`,
  });
}

export function notifyVehiculoRetirado(
  vehiculo: Pick<Vehiculo, 'descripcion' | 'marca' | 'placa' | 'sinPlaca' | 'codigoInterno'>,
) {
  toast.success('Retirado del inventario', {
    description: `${formatVehiculoResumen(vehiculo)} — dado de baja con fecha de egreso de hoy.`,
  });
}

function formatItemRegistroResumen(item: Pick<ItemRegistroDraft, 'descripcion' | 'marca'>) {
  const descripcion = item.descripcion.trim();
  const marca = item.marca.trim();
  return marca ? `${descripcion} (${marca})` : descripcion;
}

function formatItemVehiculoResumen(item: Pick<ItemVehiculoRegistroDraft, 'descripcion' | 'marca' | 'placa'>) {
  const descripcion = item.descripcion.trim();
  const marca = item.marca.trim();
  const placa = item.placa.trim();
  const base = marca ? `${descripcion} (${marca})` : descripcion;
  return placa ? `${base} — placa ${placa}` : base;
}

export function buildRegistroBienesSuccessMessage(params: {
  numeroDocumento?: string;
  nombreProveedor: string;
  items: ItemRegistroDraft[];
}) {
  const primero = params.items[0];
  const itemLabel = primero ? formatItemRegistroResumen(primero) : 'Ítem registrado';
  const extras = params.items.length > 1 ? ` y ${params.items.length - 1} ítem(s) más` : '';
  const docRef = params.numeroDocumento?.trim()
    ? `documento Nº ${params.numeroDocumento.trim()}`
    : 'sin número de documento';
  const proveedor = params.nombreProveedor.trim();

  return `${itemLabel}${extras} registrado(s) — ${docRef}, proveedor ${proveedor}.`;
}

export function buildRegistroVehiculosSuccessMessage(params: {
  numeroDocumento?: string;
  nombreProveedor: string;
  items: ItemVehiculoRegistroDraft[];
}) {
  const primero = params.items[0];
  const itemLabel = primero ? formatItemVehiculoResumen(primero) : 'Vehículo registrado';
  const extras = params.items.length > 1 ? ` y ${params.items.length - 1} vehículo(s) más` : '';
  const docRef = params.numeroDocumento?.trim()
    ? `documento Nº ${params.numeroDocumento.trim()}`
    : 'sin número de documento';
  const proveedor = params.nombreProveedor.trim();

  return `${itemLabel}${extras} registrado(s) — ${docRef}, proveedor ${proveedor}.`;
}
