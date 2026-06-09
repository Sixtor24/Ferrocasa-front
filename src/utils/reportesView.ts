import type {
  ReporteDataMap,
  ReporteRecurso,
  ReporteTableColumn,
  ReporteTableRow,
  ReporteTotales,
} from '../types/reportesApi';

export function formatReporteMoney(value: number): string {
  return value.toLocaleString('es-VE', {
    style: 'currency',
    currency: 'VES',
    maximumFractionDigits: 0,
  });
}

export function formatReporteNumber(value: number): string {
  return value.toLocaleString('es-VE');
}

export function formatReporteCell(
  value: string | number | undefined,
  format?: ReporteTableColumn['format'],
): string {
  if (value === undefined || value === null || value === '') return '—';
  if (format === 'money' && typeof value === 'number') return formatReporteMoney(value);
  if (format === 'number' && typeof value === 'number') return formatReporteNumber(value);
  return String(value);
}

export function labelEstadoVehiculo(estado: string): string {
  return estado.replace(/_/g, ' ');
}

function motivosProtocolo(porMotivo: Record<string, number>): string {
  const entries = Object.entries(porMotivo ?? {});
  if (!entries.length) return '—';
  return entries.map(([motivo, total]) => `${motivo}: ${total}`).join(' · ');
}

function flattenInventarioSeccion(
  seccion: Record<string, unknown>,
  prefijo: string,
): ReporteTableRow[] {
  const filas: ReporteTableRow[] = [];
  const data = seccion?.data;
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      filas.push({
        seccion: prefijo,
        concepto: `Ítem ${index + 1}`,
        valor: item && typeof item === 'object' ? JSON.stringify(item) : String(item ?? '—'),
      });
    });
    return filas;
  }

  Object.entries(seccion ?? {}).forEach(([clave, valor]) => {
    if (clave === 'data') return;
    filas.push({
      seccion: prefijo,
      concepto: clave,
      valor: typeof valor === 'object' ? JSON.stringify(valor) : String(valor ?? '—'),
    });
  });
  return filas;
}

export const REPORTE_OPCIONES: Array<{
  id: ReporteRecurso;
  label: string;
  description: string;
  usesAnio?: boolean;
}> = [
  {
    id: 'resumen-general',
    label: 'Resumen general',
    description: 'Totales de inventario, parcelas y valoración consolidada.',
  },
  {
    id: 'parcelas-por-zona',
    label: 'Parcelas por zona',
    description: 'Distribución de parcelas y valor por zona.',
  },
  {
    id: 'parcelas-por-responsable',
    label: 'Parcelas por responsable',
    description: 'Parcelas y valor agrupados por responsable.',
  },
  {
    id: 'bienes-por-almacen',
    label: 'Bienes por almacén',
    description: 'Bienes y valor por almacén y sede.',
  },
  {
    id: 'vehiculos-por-estado',
    label: 'Vehículos por estado',
    description: 'Flota agrupada por estado de carga.',
  },
  {
    id: 'inventario-valorado',
    label: 'Inventario valorado',
    description: 'Desglose valorado de bienes, vehículos y parcelas.',
  },
  {
    id: 'protocolos-por-mes',
    label: 'Protocolos por mes',
    description: 'Conteo mensual de protocolos por motivo.',
    usesAnio: true,
  },
];

export function getReporteColumns(recurso: ReporteRecurso): ReporteTableColumn[] {
  switch (recurso) {
    case 'parcelas-por-zona':
      return [
        { key: 'zona', label: 'Zona' },
        { key: 'total', label: 'Parcelas', format: 'number', align: 'right' },
        { key: 'valor_total', label: 'Valor total', format: 'money', align: 'right' },
      ];
    case 'parcelas-por-responsable':
      return [
        { key: 'nombre_responsable', label: 'Responsable' },
        { key: 'ci_responsable', label: 'CI' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'total', label: 'Parcelas', format: 'number', align: 'right' },
        { key: 'valor_total', label: 'Valor total', format: 'money', align: 'right' },
      ];
    case 'bienes-por-almacen':
      return [
        { key: 'nombre_almacen', label: 'Almacén' },
        { key: 'sede', label: 'Sede' },
        { key: 'total', label: 'Bienes', format: 'number', align: 'right' },
        { key: 'valor_total', label: 'Valor total', format: 'money', align: 'right' },
      ];
    case 'vehiculos-por-estado':
      return [
        { key: 'estado_vehiculo', label: 'Estado' },
        { key: 'total', label: 'Vehículos', format: 'number', align: 'right' },
        { key: 'valor_total', label: 'Valor total', format: 'money', align: 'right' },
      ];
    case 'protocolos-por-mes':
      return [
        { key: 'mes_label', label: 'Mes' },
        { key: 'total_protocolos', label: 'Protocolos', format: 'number', align: 'right' },
        { key: 'motivos', label: 'Por motivo' },
      ];
    case 'inventario-valorado':
      return [
        { key: 'seccion', label: 'Sección' },
        { key: 'concepto', label: 'Concepto / ítem' },
        { key: 'valor', label: 'Detalle' },
      ];
    case 'resumen-general':
      return [
        { key: 'grupo', label: 'Grupo' },
        { key: 'concepto', label: 'Concepto' },
        { key: 'valor', label: 'Valor', align: 'right' },
      ];
    default:
      return [];
  }
}

export function getReporteRows(recurso: ReporteRecurso, data: unknown): ReporteTableRow[] {
  if (!data) return [];

  switch (recurso) {
    case 'parcelas-por-zona': {
      const payload = data as ReporteDataMap['parcelas-por-zona'];
      return (payload.data ?? []).map((row) => ({
        zona: row.zona,
        total: row.total,
        valor_total: row.valor_total,
      }));
    }
    case 'parcelas-por-responsable': {
      const payload = data as ReporteDataMap['parcelas-por-responsable'];
      return (payload.data ?? []).map((row) => ({
        nombre_responsable: row.nombre_responsable,
        ci_responsable: row.ci_responsable,
        departamento: row.departamento,
        total: row.total,
        valor_total: row.valor_total,
      }));
    }
    case 'bienes-por-almacen': {
      const payload = data as ReporteDataMap['bienes-por-almacen'];
      return (payload.data ?? []).map((row) => ({
        nombre_almacen: row.nombre_almacen,
        sede: row.sede,
        total: row.total,
        valor_total: row.valor_total,
      }));
    }
    case 'vehiculos-por-estado': {
      const payload = data as ReporteDataMap['vehiculos-por-estado'];
      return (payload.data ?? []).map((row) => ({
        estado_vehiculo: labelEstadoVehiculo(row.estado_vehiculo),
        total: row.total,
        valor_total: row.valor_total,
      }));
    }
    case 'protocolos-por-mes': {
      const payload = data as ReporteDataMap['protocolos-por-mes'];
      return (payload.data ?? []).map((row) => ({
        mes_label: row.mes_label,
        total_protocolos: row.total_protocolos,
        motivos: motivosProtocolo(row.por_motivo),
      }));
    }
    case 'inventario-valorado': {
      const payload = data as ReporteDataMap['inventario-valorado'];
      return [
        ...flattenInventarioSeccion(payload.bienes as Record<string, unknown>, 'Bienes'),
        ...flattenInventarioSeccion(payload.vehiculos as Record<string, unknown>, 'Vehículos'),
        ...flattenInventarioSeccion(payload.parcelas as Record<string, unknown>, 'Parcelas'),
      ];
    }
    case 'resumen-general': {
      const payload = data as ReporteDataMap['resumen-general'];
      const filas: ReporteTableRow[] = [];
      Object.entries(payload.inventario ?? {}).forEach(([clave, valor]) => {
        filas.push({ grupo: 'Inventario', concepto: clave, valor: formatReporteNumber(valor) });
      });
      Object.entries(payload.parcelas ?? {}).forEach(([clave, valor]) => {
        filas.push({ grupo: 'Parcelas', concepto: clave, valor: formatReporteNumber(valor) });
      });
      Object.entries(payload.valoracion ?? {}).forEach(([clave, valor]) => {
        const format = clave.includes('total') || clave.includes('valor') ? formatReporteMoney(valor) : formatReporteNumber(valor);
        filas.push({ grupo: 'Valoración', concepto: clave, valor: format });
      });
      return filas;
    }
    default:
      return [];
  }
}

export function getReporteTotales(recurso: ReporteRecurso, data: unknown): ReporteTotales {
  if (!data) return [];

  switch (recurso) {
    case 'parcelas-por-zona': {
      const payload = data as ReporteDataMap['parcelas-por-zona'];
      return [
        { label: 'Total parcelas', value: formatReporteNumber(payload.total_parcelas ?? 0) },
        { label: 'Valor total', value: formatReporteMoney(payload.valor_total ?? 0) },
      ];
    }
    case 'parcelas-por-responsable': {
      const payload = data as ReporteDataMap['parcelas-por-responsable'];
      return [
        { label: 'Total parcelas', value: formatReporteNumber(payload.total_parcelas ?? 0) },
        { label: 'Valor total', value: formatReporteMoney(payload.valor_total ?? 0) },
      ];
    }
    case 'bienes-por-almacen': {
      const payload = data as ReporteDataMap['bienes-por-almacen'];
      return [
        { label: 'Total bienes', value: formatReporteNumber(payload.total_bienes ?? 0) },
        { label: 'Valor total', value: formatReporteMoney(payload.valor_total ?? 0) },
      ];
    }
    case 'vehiculos-por-estado': {
      const payload = data as ReporteDataMap['vehiculos-por-estado'];
      return [
        { label: 'Total vehículos', value: formatReporteNumber(payload.total_vehiculos ?? 0) },
        { label: 'Valor total', value: formatReporteMoney(payload.valor_total ?? 0) },
      ];
    }
    case 'inventario-valorado': {
      const payload = data as ReporteDataMap['inventario-valorado'];
      return [
        { label: 'Total activos', value: formatReporteNumber(payload.resumen?.total_activos ?? 0) },
        { label: 'Valor general', value: formatReporteMoney(payload.resumen?.valor_total_general ?? 0) },
      ];
    }
    case 'protocolos-por-mes': {
      const payload = data as ReporteDataMap['protocolos-por-mes'];
      const total = (payload.data ?? []).reduce((sum, item) => sum + item.total_protocolos, 0);
      return [
        { label: 'Año', value: String(payload.anio ?? '—') },
        { label: 'Total protocolos', value: formatReporteNumber(total) },
      ];
    }
    case 'resumen-general': {
      const payload = data as ReporteDataMap['resumen-general'];
      return [
        { label: 'Valoración general', value: formatReporteMoney(payload.valoracion?.total_general ?? 0) },
      ];
    }
    default:
      return [];
  }
}

export function resumenGeneralMetricas(data: ReporteDataMap['resumen-general'] | null | undefined) {
  if (!data) {
    return {
      bienes: 0,
      vehiculos: 0,
      parcelas: 0,
      valorGeneral: 0,
      protocolos: 0,
    };
  }
  return {
    bienes: data.inventario?.bienes ?? 0,
    vehiculos: data.inventario?.vehiculos ?? 0,
    parcelas: data.inventario?.parcelas ?? 0,
    valorGeneral: data.valoracion?.total_general ?? 0,
    protocolos: data.inventario?.protocolos ?? 0,
  };
}
