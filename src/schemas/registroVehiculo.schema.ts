import { z } from 'zod';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';

const codigoInvalido = (valor: string) => {
  const normalizado = valor.trim().toUpperCase();
  return normalizado.length > 0 && !['S/C', 'S/C/', 'SC'].includes(normalizado);
};

export const itemVehiculoRegistroFormSchema = z.object({
  codigoInterno: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .refine(codigoInvalido, { message: 'Debe indicar un código válido del vehículo' }),
  placa: z.string().trim().min(1, 'La placa es obligatoria'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  marca: z.string().optional().default(''),
  color: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  anioFabricacion: z.coerce
    .number({ error: 'Indique el año de fabricación' })
    .int()
    .min(1900, 'Año inválido')
    .max(2100, 'Año inválido'),
  serialMotor: z.string().optional().default(''),
  serialCarroceria: z.string().optional().default(''),
  cantidad: z.coerce.number().int().min(1, 'La cantidad mínima es 1'),
  valorAdquisicion: z.coerce
    .number({ error: 'Indique el valor de adquisición' })
    .min(0, 'El valor no puede ser negativo'),
  unidadAdministrativa: z.string().min(1, 'Seleccione la unidad administrativa'),
  almacen: z.string().min(1, 'Seleccione el almacén'),
  idCategoriaGeneral: z.coerce.number().int().positive('Seleccione la categoría'),
  idSubcategoria: z.coerce.number().int().positive('Seleccione la subcategoría'),
  idCategoriaEspecifica: z.coerce.number().int().positive('Seleccione la categoría específica'),
  estadoUso: z.enum(['En uso', 'En obsolescencia', 'Obsoleto']),
  condicionFisica: z.enum(['Bueno', 'Regular', 'Dañado']),
  observaciones: z.string().optional().default(''),
});

export type ItemVehiculoRegistroForm = z.infer<typeof itemVehiculoRegistroFormSchema>;

export function itemVehiculoDraftToFormInput(item: ItemVehiculoRegistroDraft): ItemVehiculoRegistroForm {
  return {
    codigoInterno: item.codigoInterno,
    placa: item.placa,
    descripcion: item.descripcion,
    marca: item.marca,
    color: item.color,
    modelo: item.modelo,
    anioFabricacion: item.anioFabricacion,
    serialMotor: item.serialMotor,
    serialCarroceria: item.serialCarroceria,
    cantidad: item.cantidad,
    valorAdquisicion: item.valorAdquisicion,
    unidadAdministrativa: item.unidadAdministrativa,
    almacen: item.almacen,
    idCategoriaGeneral: item.idCategoriaGeneral,
    idSubcategoria: item.idSubcategoria,
    idCategoriaEspecifica: item.idCategoriaEspecifica,
    estadoUso: item.estadoUso,
    condicionFisica: item.condicionFisica,
    observaciones: item.observaciones,
  };
}

export const registroVehiculosListSchema = z
  .array(itemVehiculoRegistroFormSchema)
  .min(1, 'Agregue al menos un ítem con el botón +');
