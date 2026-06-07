import { z } from 'zod';

export const documentoParcelaFormSchema = z.object({
  numeroDocumento: z.string().optional().default(''),
  numeroPropiedad: z.coerce.number().int().positive('Indique el nro de propiedad'),
  nombrePropiedad: z.string().trim().min(1, 'Indique el nombre de la propiedad'),
  ubicacionPropiedad: z.string().trim().min(1, 'Indique la ubicación'),
  fechaAdquisicion: z.string().min(1, 'Indique la fecha de adquisición'),
  formaAdquisicion: z.enum(['Compra', 'Donacion', 'Confiscacion']),
  moneda: z.enum(['Bs', 'USD', 'EUR']),
});

export type DocumentoParcelaForm = z.infer<typeof documentoParcelaFormSchema>;

export const parcelaRegistroFormSchema = z.object({
  identificacion: z.string().trim().min(1, 'Indique la identificación'),
  zona: z.string().trim().min(1, 'Indique lote / manzana'),
  zonificacion: z.string().trim().min(1, 'Seleccione la zonificación'),
  ubicacionAdicional: z.string().trim().min(1, 'Indique la ubicación adicional'),
  areaTotalM2: z.coerce.number().positive('Indique el área total'),
  valorAdquisicion: z.coerce.number().min(0, 'El valor no puede ser negativo'),
  ciResponsable: z.string().trim().min(1, 'Seleccione el responsable'),
  observaciones: z.string().optional().default(''),
  acreditacionTecnicaAmbiental: z.enum(['Sí', 'No', 'En trámite']),
  levantamientoTopografico: z.enum(['Sí', 'En trámite']),
});

export type ParcelaRegistroForm = z.infer<typeof parcelaRegistroFormSchema>;

export const registroParcelasListSchema = z
  .array(parcelaRegistroFormSchema)
  .min(1, 'Agregue al menos una parcela con el botón +');

export function parcelaDraftToFormInput(item: {
  identificacion: string;
  zona: string;
  zonificacion: string;
  ubicacionAdicional: string;
  areaTotalM2: number;
  valorAdquisicion: number;
  ciResponsable: string;
  observaciones: string;
  acreditacionTecnicaAmbiental: 'Sí' | 'No' | 'En trámite';
  levantamientoTopografico: 'Sí' | 'En trámite';
}): ParcelaRegistroForm {
  return {
    identificacion: item.identificacion,
    zona: item.zona,
    zonificacion: item.zonificacion,
    ubicacionAdicional: item.ubicacionAdicional,
    areaTotalM2: item.areaTotalM2,
    valorAdquisicion: item.valorAdquisicion,
    ciResponsable: item.ciResponsable,
    observaciones: item.observaciones,
    acreditacionTecnicaAmbiental: item.acreditacionTecnicaAmbiental,
    levantamientoTopografico: item.levantamientoTopografico,
  };
}
