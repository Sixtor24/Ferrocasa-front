import { z } from 'zod';

export const bienMuebleSchema = z.object({
  sede: z.string().min(1, 'Sede es requerida'),
  unidadAdministrativa: z.string().min(1, 'Unidad administrativa es requerida'),
  codigoInterno: z.string().min(1, 'Código interno es requerido'),
  sinCodigo: z.boolean().default(false),
  descripcion: z.string().min(3, 'Descripción debe tener al menos 3 caracteres'),
  formaAdquisicion: z.enum(['Compra', 'Donación', 'Transferencia', 'Asignación', 'Comodato', 'Desconocida']),
  fechaAdquisicion: z.string().optional(),
  numeroDocumento: z.string().optional(),
  moneda: z.enum(['Bs', 'USD', 'Bs.F', 'Bs.S']).default('Bs'),
  valorAdquisicion: z.number().nonnegative('El valor no puede ser negativo').nullable().default(null),
  estadoUso: z.enum(['En uso', 'En almacén', 'En tránsito', 'Desincorporado', 'Por verificar']),
  condicionFisica: z.enum(['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible']),
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
  (data) => data.sinCodigo || !['S/C', 'S/C/', 'SC', ''].includes(data.codigoInterno.trim().toUpperCase()),
  { message: 'Si el bien no tiene código, marque "Sin código"', path: ['codigoInterno'] }
).refine(
  (data) => data.sinSerial || data.serial.trim() !== '',
  { message: 'Serial es requerido. Si no tiene serial, marque "Sin serial"', path: ['serial'] }
);

export type BienMuebleForm = z.infer<typeof bienMuebleSchema>;
