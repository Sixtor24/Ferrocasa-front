import { z } from 'zod';

export const inmuebleSchema = z.object({
  ubicacion: z.string().min(1, 'Ubicación es requerida'),
  areaSegunDocumento: z.number().positive('El área debe ser mayor a 0').nullable().default(null),
  areaDesincorporada: z.number().nonnegative().nullable().default(null),
  areaComprometida: z.number().nonnegative().nullable().default(null),
  areaDisponible: z.number().nonnegative('El área disponible no puede ser negativa').nullable().default(null),
  identificacionParcela: z.string().min(1, 'Identificación de parcela es requerida'),
  zonificacion: z.enum(['Residencial', 'Comercial', 'Industrial', 'Mixta', 'Sin zonificar']),
  estadoOcupacion: z.enum(['Disponible', 'Ocupado', 'Comprometido', 'Desincorporado', 'En litigio']),
  usoActual: z.enum(['Vivienda', 'Comercio', 'Oficina', 'Terreno baldío', 'Equipamiento', 'Sin uso', 'Otro']),
  linderos: z.string().optional().default(''),
  coordenadas: z.string().optional().default(''),
  datosRegistrales: z.string().optional().default(''),
  proyecto: z.string().optional().default(''),
  tipoInmueble: z.string().min(1, 'Tipo de inmueble es requerido'),
  precio: z.number().nonnegative().nullable().default(null),
  observaciones: z.string().optional().default(''),
}).refine(
  (data) => {
    if (data.areaDisponible !== null && data.areaDisponible < 0) return false;
    return true;
  },
  { message: 'El área disponible no puede ser negativa', path: ['areaDisponible'] }
).refine(
  (data) => {
    if (data.estadoOcupacion === 'Ocupado') return true; // no se puede vender/asignar ocupada
    return true;
  },
  { path: ['estadoOcupacion'] }
);

export type InmuebleForm = z.infer<typeof inmuebleSchema>;
