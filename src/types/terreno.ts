export interface Terreno {
  id: number | string;
  codigo: string;
  identificacion: string;
  ubicacion: string;
  areaDocumento: number;
  areaDesincorporada: number;
  areaDisponible: number;
  zonificacion: string;
  levantamientoTopografico: 'Sí' | 'No' | 'En trámite';
  acreditacionTecnicaAmbiental: 'Sí' | 'No' | 'En trámite';
  /** Valor crudo API: `Si` | `Solicitar` */
  levantamientoTopograficoApi: string;
  /** Valor crudo API: `Si_posee` | `No_posee` */
  acreditacionAmbientalApi: string;
  nombre: string;
  nroPropiedad: string;
  fechaIngreso: string;
  zona: string;
  ubicacionAdicional: string;
  responsable: string;
  ciResponsable: string;
  valorAdquisicion: number | null;
  moneda: 'Bs' | 'USD' | 'Bs.F' | 'Bs.S';
  observacion: string;
  areaComprometida: number;
  numeroDocumento: string;
  fechaAdquisicion: string;
  formaAdquisicion: string;
  areaTotalM2: number;
}

export interface ProtocolizacionTerreno {
  id: number;
  terrenoId: number | string;
  tipoProtocolizacion: string;
  motivo: string;
  beneficiario: string;
  fecha: string;
  areaComprometidaM2: number;
}

export const ZONIFICACIONES = ['Residencial', 'Comercial', 'Industrial', 'Mixto', 'Institucional', 'Verde'] as const;
export const ESTADOS_TRAMITE = ['Sí', 'No', 'En trámite'] as const;
/** Valores permitidos por el API en `levantamiento_topografico` (Si | Solicitar). */
export const LEVANTAMIENTO_TOPOGRAFICO_OPCIONES = ['Sí', 'No', 'En trámite'] as const;
