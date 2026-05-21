import { z } from 'zod';

export const inventarioCementerioSchema = z.object({
  codigo: z.string().min(1, 'Código es requerido'),
  descripcion: z.string().min(3, 'Descripción debe tener al menos 3 caracteres'),
  marca: z.string().min(1, 'Marca es requerida'),
  modelo: z.string().optional().default(''),
  color: z.string().optional().default(''),
  serial: z.string().optional().default(''),
  estadoBien: z.enum(['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible']),
  area: z.enum([
    'Cocina', 'Galpón', 'Taller', 'Oficinas', 'Crematorio',
    'Sala Velatoria', 'Patio', 'Principal', 'Sala de Espera', 'Mantenimiento',
  ]),
  observaciones: z.string().optional().default(''),
});

export const parcelaCementerioSchema = z.object({
  identificacion: z.string().min(1, 'Identificación de parcela es requerida'),
  sector: z.string().min(1, 'Sector es requerido'),
  tipo: z.enum(['Individual', 'Familiar', 'Nicho', 'Osario', 'Cremación']),
  estatus: z.enum(['Disponible', 'Ocupada', 'Reservada', 'Mantenimiento', 'Vencida']),
  ocupante: z.string().optional().default(''),
  fechaAsignacion: z.string().optional().default(''),
  fechaVencimiento: z.string().optional().default(''),
  contacto: z.string().optional().default(''),
  observaciones: z.string().optional().default(''),
}).refine(
  (data) => data.estatus !== 'Ocupada' || data.ocupante.trim() !== '',
  { message: 'Debe indicar el ocupante para parcelas ocupadas', path: ['ocupante'] }
);

export type InventarioCementerioForm = z.infer<typeof inventarioCementerioSchema>;
export type ParcelaCementerioForm = z.infer<typeof parcelaCementerioSchema>;
