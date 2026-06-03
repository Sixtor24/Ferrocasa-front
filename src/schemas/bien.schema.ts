import { z } from 'zod';

export const bienMuebleSchema = z.object({
  sede: z.string().min(1, 'Sede es requerida'),
  unidadAdministrativa: z.string().min(1, 'Unidad administrativa es requerida'),
  codigoInterno: z
    .string()
    .trim()
    .min(1, 'Código interno es requerido')
    .refine(
      (v) => !['S/C', 'S/C/', 'SC'].includes(v.toUpperCase()),
      { message: 'Debe indicar un código válido del bien' },
    ),
  descripcion: z.string().min(3, 'Descripción debe tener al menos 3 caracteres'),
  formaAdquisicion: z.enum(['Compra', 'Donación', 'Transferencia', 'Asignación', 'Comodato', 'Desconocida']),
  fechaAdquisicion: z.string().optional(),
  numeroDocumento: z.string().optional(),
  moneda: z.enum(['Bs', 'USD', 'EUR']).default('Bs'),
  valorAdquisicion: z.number().nonnegative('El valor no puede ser negativo').nullable().default(null),
  estadoUso: z.enum(['En uso', 'En obsolescencia', 'Obsoleto']),
  condicionFisica: z.enum(['Bueno', 'Regular', 'Dañado']),
  marca: z.string().min(1, 'Marca es requerida'),
  modelo: z.string().optional().default(''),
  color: z.string().optional().default(''),
  serial: z.string().optional().default(''),
  sinSerial: z.boolean().default(false),
  categoriaGeneral: z.string().min(1, 'Categoría es requerida'),
  subcategoria: z.string().optional().default(''),
  categoriaEspecifica: z.string().optional().default(''),
  codigoCategoria: z.string().optional().default(''),
  ubicacion: z.string().min(1, 'Ubicación es requerida'),
  observaciones: z.string().optional().default(''),
}).refine(
  (data) => data.sinSerial || data.serial.trim() !== '',
  { message: 'Serial es requerido. Si no tiene serial, marque "Sin serial"', path: ['serial'] }
);

export type BienMuebleForm = z.infer<typeof bienMuebleSchema>;

const backendId = (label: string) =>
  z.coerce
    .number({ error: `${label} debe ser numérico` })
    .int(`${label} debe ser un entero`)
    .positive(`${label} debe ser un ID válido del backend`);

export const bienMuebleBackendIdsSchema = z.object({
  numeroDocumento: backendId('Número de documento'),
  ubicacion: backendId('Almacén'),
  codigoCategoria: backendId('Categoría específica'),
});

export type BienMuebleBackendIds = z.infer<typeof bienMuebleBackendIdsSchema>;
