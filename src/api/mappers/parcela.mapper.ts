import type { Terreno, ProtocolizacionTerreno } from '../../types/terreno';
import type { Inmueble } from '../../types/inmueble';
import type { ApiParcela } from '../types';
import {
  mapAcreditacionAmbiental,
  mapLevantamientoTopografico,
  mapMoneda,
  toIsoDate,
  toNumber,
} from './enums';

function areaFromDoc(p: ApiParcela): number {
  return toNumber(p.documento?.area_total_m2) ?? 0;
}

function areaComprometida(p: ApiParcela): number {
  return toNumber(p.compromiso?.cantidad_m2) ?? 0;
}

function areaDesincorporada(p: ApiParcela): number {
  return toNumber(p.desincorporacion?.cantidad_m2) ?? 0;
}

export function mapApiParcelaToTerreno(p: ApiParcela): Terreno {
  const areaDoc = areaFromDoc(p);
  const areaComp = areaComprometida(p);
  const areaDes = areaDesincorporada(p);

  return {
    id: p.id_terreno,
    codigo: `T-${String(p.id_terreno).padStart(4, '0')}`,
    identificacion: p.nombre ?? `Parcela ${p.id_terreno}`,
    ubicacion: p.documento?.propiedad?.ubicacion ?? p.ubicacion_adicional ?? '—',
    areaDocumento: areaDoc,
    areaDesincorporada: areaDes,
    areaDisponible: Math.max(0, areaDoc - areaComp - areaDes),
    zonificacion: p.zonificacion ?? '—',
    levantamientoTopografico: mapLevantamientoTopografico(p.levantamiento_topografico),
    acreditacionTecnicaAmbiental: mapAcreditacionAmbiental(p.acreditacion_ambiental),
    nombre: p.nombre ?? '—',
    nroPropiedad: String(p.documento?.propiedad?.numero_propiedad ?? p.documento?.numero_propiedad ?? '—'),
    fechaIngreso: toIsoDate(p.documento?.fecha_adquisicion) || '—',
    zona: p.zona ?? '—',
    ubicacionAdicional: p.ubicacion_adicional ?? '—',
    responsable: p.responsable?.nombre ?? '—',
    ciResponsable: p.ci_responsable ?? p.responsable?.ci_responsable ?? '',
    valorAdquisicion: toNumber(p.documento?.valor_adquisicion),
    moneda: mapMoneda(p.documento?.moneda),
    observacion: p.observaciones ?? '—',
    areaComprometida: areaComp,
    numeroDocumento: String(p.id_documento_propiedad),
    fechaAdquisicion: toIsoDate(p.documento?.fecha_adquisicion) || '—',
    formaAdquisicion: (p.documento?.forma_adquisicion ?? 'Compra').replace(/_/g, ' '),
    areaTotalM2: areaDoc,
  };
}

export function mapApiParcelaToInmueble(p: ApiParcela): Inmueble {
  const areaDoc = areaFromDoc(p);
  const areaComp = areaComprometida(p);
  const areaDes = areaDesincorporada(p);

  let estadoOcupacion: Inmueble['estadoOcupacion'] = 'Disponible';
  if (p.id_comprometida) estadoOcupacion = 'Comprometido';
  else if (p.id_desincorporada) estadoOcupacion = 'Desincorporado';

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

export function mapParcelaProtocolos(p: ApiParcela): ProtocolizacionTerreno[] {
  const items: ProtocolizacionTerreno[] = [];

  if (p.compromiso?.protocolo) {
    items.push({
      id: p.compromiso.id_comprometida,
      terrenoId: p.id_terreno,
      tipoProtocolizacion: 'Compromiso',
      motivo: p.compromiso.protocolo.motivo.replace(/_/g, ' '),
      beneficiario: p.compromiso.protocolo.id_beneficiado
        ? String(p.compromiso.protocolo.id_beneficiado)
        : '—',
      fecha: toIsoDate(p.compromiso.fecha_compromiso ?? p.compromiso.protocolo.fecha_protocolo),
      areaComprometidaM2: toNumber(p.compromiso.cantidad_m2) ?? 0,
    });
  }

  if (p.desincorporacion?.protocolo) {
    items.push({
      id: p.desincorporacion.id_desincorporada,
      terrenoId: p.id_terreno,
      tipoProtocolizacion: 'Desincorporación',
      motivo: p.desincorporacion.protocolo.motivo.replace(/_/g, ' '),
      beneficiario: p.desincorporacion.protocolo.id_beneficiado
        ? String(p.desincorporacion.protocolo.id_beneficiado)
        : '—',
      fecha: toIsoDate(
        p.desincorporacion.fecha_desincorporacion ?? p.desincorporacion.protocolo.fecha_protocolo
      ),
      areaComprometidaM2: toNumber(p.desincorporacion.cantidad_m2) ?? 0,
    });
  }

  return items;
}
