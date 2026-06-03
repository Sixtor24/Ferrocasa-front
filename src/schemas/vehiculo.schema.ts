import { z } from 'zod';

export const vehiculoSchema = z.object({
  codigoInterno: z.string().min(1, 'Código interno es requerido'),
  marca: z.string().min(1, 'Marca es requerida'),
  modelo: z.string().min(1, 'Modelo es requerido'),
  color: z.string().optional().default(''),
  anioFabricacion: z.number().int().min(1950).max(new Date().getFullYear() + 1).nullable().default(null),
  serialMotor: z.string().optional().default(''),
  sinSerialMotor: z.boolean().default(false),
  serialCarroceria: z.string().optional().default(''),
  sinSerialCarroceria: z.boolean().default(false),
  placa: z.string().optional().default(''),
  sinPlaca: z.boolean().default(false),
  condicionFisica: z.enum(['Bueno', 'Regular', 'Dañado']),
  estadoUso: z.enum(['En uso', 'En obsolescencia', 'Obsoleto']),
  categoriaGeneral: z.string().min(1, 'Categoría es requerida'),
  subcategoria: z.string().optional().default(''),
  documentoAdquisicion: z.string().optional().default(''),
  valorAdquisicion: z.number().nonnegative().nullable().default(null),
  observaciones: z.string().optional().default(''),
}).refine(
  (data) => data.sinPlaca || data.placa.trim() !== '',
  { message: 'Placa es requerida. Si no tiene placa, marque "Sin placa"', path: ['placa'] }
).refine(
  (data) => data.sinSerialCarroceria || data.serialCarroceria.trim() !== '',
  { message: 'Serial de carrocería requerido. Si no tiene, marque "Sin serial"', path: ['serialCarroceria'] }
);

export type VehiculoForm = z.infer<typeof vehiculoSchema>;
