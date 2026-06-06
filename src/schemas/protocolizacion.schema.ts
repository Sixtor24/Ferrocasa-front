import { z } from 'zod';
import type { MotivoProtocolo } from '../api/services/protocolos.service';

const MOTIVOS: MotivoProtocolo[] = [
  'Venta',
  'Ejecucion_de_obras',
  'Afectado_por_bienhechurias_de_FMO',
];

export const protocolizacionFormSchema = z.object({
  tipo: z.enum(['Compromiso', 'Desincorporación']),
  motivo: z.enum(MOTIVOS),
  fecha: z.string().min(1, 'Indique la fecha'),
  idBeneficiado: z.number().int().positive('Indique el beneficiario'),
  cantidadM2: z.number().positive('Indique la cantidad de área'),
});

export type ProtocolizacionForm = z.infer<typeof protocolizacionFormSchema>;
