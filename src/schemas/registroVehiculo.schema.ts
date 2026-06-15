import { z } from 'zod';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';
import { documentoRegistroFormSchema } from './registro.schema';

export const documentoRegistroVehiculoFormSchema = documentoRegistroFormSchema.extend({
  numeroDocumento: z
    .string()
    .trim()
    .min(1, 'Indique el número de documento de ingreso')
    .max(20, 'El nro de documento no puede superar 20 caracteres'),
});

export type DocumentoRegistroVehiculoForm = z.infer<typeof documentoRegistroVehiculoFormSchema>;

export const itemVehiculoRegistroFormSchema = z.object({
  codigoInterno: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(20, 'El código no puede superar 20 caracteres'),
  placa: z.string().trim().min(1, 'La placa es obligatoria'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  marca: z.string().optional().default(''),
  color: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  anioFabricacion: z.coerce
    .number({ error: 'Indique el año de fabricación' })
    .int()
    .min(1900, 'El año debe ser 1900 o posterior')
    .max(2100, 'El año no puede ser mayor a 2100'),
  serialMotor: z.string().optional().default(''),
  serialCarroceria: z.string().optional().default(''),
  cantidad: z.coerce.number().int().min(0, 'La cantidad no puede ser negativa'),
  valorAdquisicion: z.coerce
    .number({ error: 'Indique el valor de adquisición' })
    .min(0, 'El valor no puede ser negativo'),
  unidadAdministrativa: z.string().min(1, 'Seleccione la unidad administrativa'),
  ciResponsable: z.string().trim().min(1, 'Configure el responsable del almacén en Configuración'),
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
    ciResponsable: item.ciResponsable,
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
  .min(1, 'Agregue al menos un ítem con el botón +')
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const codigo = item.codigoInterno.trim();
      if (seen.has(codigo)) {
        ctx.addIssue({
          code: 'custom',
          message: `El código ${codigo} está duplicado en los ítems`,
          path: [index, 'codigoInterno'],
        });
      }
      seen.add(codigo);
    });
  });
