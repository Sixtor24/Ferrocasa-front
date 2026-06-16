import type { Terreno, ProtocolizacionTerreno } from '../../types/terreno';
import type { Inmueble } from '../../types/inmueble';
import type { ApiParcela } from '../types';
import {
  extractCodigoMeta,
  extractFechaAdquisicionMeta,
  extractFechaIngresoMeta,
  extractNumeroDocumentoMeta,
  stripParcelaObservacionesMeta,
} from '../../utils/parcelaFechaMeta';
import { sumCantidadM2 } from '../../utils/parcelaMovimientos';
import {
  mapAcreditacionAmbiental,
  mapLevantamientoTopografico,
  mapMoneda,
  toIsoDate,
  toNumber,
} from './enums';

function fechaIngresoParcela(p: ApiParcela): string {
  return (
    toIsoDate(p.fecha_ingreso)
    || extractFechaIngresoMeta(p.observaciones)
    || ''
  );
}

function fechaAdquisicionParcela(p: ApiParcela): string {
  return (
    extractFechaAdquisicionMeta(p.observaciones)
    || toIsoDate(p.documento?.fecha_adquisicion)
    || ''
  );
}

function numeroDocumentoParcela(p: ApiParcela): string {
  return (
    p.documento?.numero_documento?.trim()
    || extractNumeroDocumentoMeta(p.observaciones)
    || String(p.id_documento_propiedad)
  );
}

function codigoParcela(p: ApiParcela): string {
  return (
    p.codigo?.trim()
    || extractCodigoMeta(p.observaciones)
    || `T-${String(p.id_terreno).padStart(4, '0')}`
  );
}

function areaFromDoc(p: ApiParcela): number {
  return toNumber(p.documento?.area_total_m2) ?? 0;
}

function areaComprometida(p: ApiParcela): number {
  if (p.compromisos?.length) return sumCantidadM2(p.compromisos);
  return toNumber(p.compromiso?.cantidad_m2) ?? 0;
}

function areaDesincorporada(p: ApiParcela): number {
  if (p.desincorporaciones?.length) return sumCantidadM2(p.desincorporaciones);
  return toNumber(p.desincorporacion?.cantidad_m2) ?? 0;
}

export function mapApiParcelaToTerreno(p: ApiParcela): Terreno {
  const areaDoc = areaFromDoc(p);
  const areaComp = areaComprometida(p);
  const areaDes = areaDesincorporada(p);

  return {
    id: p.id_terreno,
    codigo: codigoParcela(p),
    identificacion: p.nombre ?? `Parcela ${p.id_terreno}`,
    ubicacion: p.documento?.propiedad?.ubicacion ?? p.ubicacion_adicional ?? '—',
    areaDocumento: areaDoc,
    areaDesincorporada: areaDes,
    areaDisponible: Math.max(0, areaDoc - areaComp - areaDes),
    zonificacion: p.zonificacion ?? '—',
    levantamientoTopografico: mapLevantamientoTopografico(p.levantamiento_topografico),
    acreditacionTecnicaAmbiental: mapAcreditacionAmbiental(p.acreditacion_ambiental),
    levantamientoTopograficoApi: p.levantamiento_topografico ?? '',
    acreditacionAmbientalApi: p.acreditacion_ambiental ?? '',
    nombre: p.nombre ?? '—',
    nroPropiedad: String(p.documento?.propiedad?.numero_propiedad ?? p.documento?.numero_propiedad ?? '—'),
    fechaIngreso: fechaIngresoParcela(p) || '—',
    zona: p.zona ?? '—',
    ubicacionAdicional: p.ubicacion_adicional ?? '—',
    responsable: p.responsable?.nombre ?? '—',
    ciResponsable: p.ci_responsable ?? p.responsable?.ci_responsable ?? '',
    valorAdquisicion: toNumber(p.valor_adquisicion) ?? toNumber(p.documento?.valor_adquisicion),
    moneda: mapMoneda(p.documento?.moneda),
    observacion: stripParcelaObservacionesMeta(p.observaciones) || '—',
    areaComprometida: areaComp,
    numeroDocumento: numeroDocumentoParcela(p),
    fechaAdquisicion: fechaAdquisicionParcela(p) || '—',
    formaAdquisicion: (p.documento?.forma_adquisicion ?? 'Compra').replace(/_/g, ' '),
    areaTotalM2: areaDoc,
  };
}

export function mapApiParcelaToInmueble(p: ApiParcela): Inmueble {
  const areaDoc = areaFromDoc(p);
  const areaComp = areaComprometida(p);
  const areaDes = areaDesincorporada(p);

  let estadoOcupacion: Inmueble['estadoOcupacion'] = 'Disponible';
  const areaDisp = Math.max(0, areaDoc - areaComp - areaDes);
  if (areaDisp === 0 && areaComp === 0 && areaDes > 0) {
    estadoOcupacion = 'Desincorporado';
  } else if (areaComp > 0 || p.id_comprometida) {
    estadoOcupacion = 'Comprometido';
  }

  return {
    id: p.id_terreno,
    ubicacion: p.documento?.propiedad?.ubicacion ?? p.ubicacion_adicional ?? '—',
    areaSegunDocumento: areaDoc || null,
    areaDesincorporada: areaDes || null,
    areaComprometida: areaComp || null,
    areaDisponible: Math.max(0, areaDoc - areaComp - areaDes) || null,
    identificacionParcela: p.nombre ?? `Parcela ${p.id_terreno}`,
    zonificacion: (p.zonificacion as Inmueble['zonificacion']) ?? 'Sin zonificar',
    estadoOcupacion,
    usoActual: 'Terreno baldío',
    linderos: '',
    coordenadas: '',
    datosRegistrales: String(p.documento?.propiedad?.numero_propiedad ?? ''),
    proyecto: p.documento?.propiedad?.nombre ?? '—',
    tipoInmueble: 'Terreno',
    precio: null,
    observaciones: p.observaciones ?? '',
  };
}

function mapProtocoloItem(
  p: ApiParcela,
  tipo: ProtocolizacionTerreno['tipoProtocolizacion'],
  movimiento: NonNullable<ApiParcela['compromiso']> | NonNullable<ApiParcela['desincorporacion']>,
  fechaMovimiento: string | null | undefined,
): ProtocolizacionTerreno {
  const proto = movimiento.protocolo;
  const id =
    'id_comprometida' in movimiento ? movimiento.id_comprometida : movimiento.id_desincorporada;

  return {
    id,
    terrenoId: p.id_terreno,
    tipoProtocolizacion: tipo,
    motivo: proto?.motivo?.replace(/_/g, ' ') ?? '—',
    beneficiario: proto?.id_beneficiado != null ? String(proto.id_beneficiado) : '—',
    fecha: toIsoDate(fechaMovimiento ?? proto?.fecha_protocolo) || '—',
    areaComprometidaM2: toNumber(movimiento.cantidad_m2) ?? 0,
  };
}

export function mapParcelaProtocolos(p: ApiParcela): ProtocolizacionTerreno[] {
  const items: ProtocolizacionTerreno[] = [];
  const compromisos = p.compromisos?.length
    ? p.compromisos
    : p.compromiso
      ? [p.compromiso]
      : [];
  const desincorporaciones = p.desincorporaciones?.length
    ? p.desincorporaciones
    : p.desincorporacion
      ? [p.desincorporacion]
      : [];

  for (const compromiso of compromisos) {
    items.push(
      mapProtocoloItem(p, 'Compromiso', compromiso, compromiso.fecha_compromiso),
    );
  }

  for (const desincorporacion of desincorporaciones) {
    items.push(
      mapProtocoloItem(
        p,
        'Desincorporación',
        desincorporacion,
        desincorporacion.fecha_desincorporacion,
      ),
    );
  }

  return items;
}
