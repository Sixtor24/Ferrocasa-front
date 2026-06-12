import { z } from 'zod';
import type { MotivoProtocolo } from '../api/services/protocolos.service';
import { isValidIdBeneficiado, normalizeIdBeneficiado } from '../utils/beneficiario';

const MOTIVOS: MotivoProtocolo[] = [
  'Venta',
  'Ejecucion_de_obras',
  'Afectado_por_bienhechurias_de_FMO',
];

export const protocolizacionFormSchema = z.object({
  tipo: z.enum(['Compromiso', 'Desincorporación']),
  motivo: z.enum(MOTIVOS),
  fecha: z.string().min(1, 'Indique la fecha'),
  beneficiario: z
    .string()
    .trim()
    .min(1, 'Indique el beneficiario')
    .transform(normalizeIdBeneficiado)
    .refine(isValidIdBeneficiado, 'Use cédula (V-12345678) o código BEN-0001'),
  cantidadM2: z.number().positive('Indique la cantidad de área'),
});

export type ProtocolizacionForm = z.infer<typeof protocolizacionFormSchema>;

/** Retiro de inventario: beneficiario no se envía al API (`id_beneficiado: null`). */
export const protocolizacionFormSchemaLocked = protocolizacionFormSchema.extend({
  beneficiario: z.string().optional(),
});
