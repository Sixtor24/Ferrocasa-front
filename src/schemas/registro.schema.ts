import { z } from 'zod';
import type { ItemRegistroDraft } from '../types/registroBienItem';
import type { CondicionFisica } from '../types/bien';

function normalizeCondicionFisica(condicion: CondicionFisica): 'Bueno' | 'Regular' | 'Dañado' {
  return condicion === 'Bueno' || condicion === 'Regular' || condicion === 'Dañado'
    ? condicion
    : 'Dañado';
}

export const documentoRegistroFormSchema = z.object({
  numeroDocumento: z.string().optional().default(''),
  nombreProveedor: z.string().trim().min(1, 'Indique el nombre del proveedor'),
  fechaAdquisicion: z.string().min(1, 'Indique la fecha de adquisición'),
  formaAdquisicion: z.enum(['Compra', 'Donacion', 'Confiscacion']),
  sede: z.string().min(1, 'Seleccione la sede'),
  moneda: z.enum(['Bs', 'USD', 'EUR']),
});

export type DocumentoRegistroForm = z.infer<typeof documentoRegistroFormSchema>;

export const itemRegistroFormSchema = z
  .object({
    descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
    color: z.string().optional().default(''),
    cantidad: z.coerce
      .number()
      .int('La cantidad debe ser entera')
      .min(1, 'La cantidad debe ser al menos 1'),
    unidadAdministrativa: z.string().min(1, 'Seleccione la unidad administrativa'),
    idCategoriaGeneral: z.coerce
      .number()
      .int()
      .positive('Seleccione la categoría'),
    idSubcategoria: z.coerce.number().int().positive('Seleccione la subcategoría'),
    idCategoriaEspecifica: z.coerce.number().int().positive('Seleccione la categoría específica'),
    estadoUso: z.enum(['En uso', 'En obsolescencia', 'Obsoleto']),
    serial: z.string().optional().default(''),
    sinSerial: z.boolean().default(false),
    marca: z.string().trim().min(1, 'La marca es obligatoria'),
    modelo: z.string().optional().default(''),
    valorAdquisicion: z.coerce
      .number({ error: 'Indique el valor de adquisición' })
      .min(0, 'El valor no puede ser negativo'),
    almacen: z.string().min(1, 'Seleccione el almacén'),
    observaciones: z.string().optional().default(''),
    consumibilidad: z.enum(['Perecederos', 'No_perecedero']),
    condicionFisica: z.enum(['Bueno', 'Regular', 'Dañado']),
  })
  .refine((data) => data.sinSerial || data.serial.trim().length > 0, {
    message: 'Indique el serial o marque "Sin serial"',
    path: ['serial'],
  });

export type ItemRegistroForm = z.infer<typeof itemRegistroFormSchema>;

export function itemDraftToFormInput(item: ItemRegistroDraft): ItemRegistroForm {
  return {
    descripcion: item.descripcion,
    color: item.color,
    cantidad: item.cantidad,
    unidadAdministrativa: item.unidadAdministrativa,
    idCategoriaGeneral: item.idCategoriaGeneral,
    idSubcategoria: item.idSubcategoria,
    idCategoriaEspecifica: item.idCategoriaEspecifica,
    estadoUso: item.estadoUso,
    serial: item.serial,
    sinSerial: item.sinSerial,
    marca: item.marca,
    modelo: item.modelo,
    valorAdquisicion: item.valorAdquisicion,
    almacen: item.almacen,
    observaciones: item.observaciones,
    consumibilidad: item.consumibilidad,
    condicionFisica: normalizeCondicionFisica(item.condicionFisica),
  };
}

export const registroItemsListSchema = z
  .array(itemRegistroFormSchema)
  .min(1, 'Agregue al menos un ítem con el botón +');
