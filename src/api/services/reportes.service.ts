import { apiDownload, apiRequest } from '../client';
import type { ApiItemResponse } from '../types';
import type { ReporteDataMap, ReporteRecurso } from '../../types/reportesApi';

export async function fetchReporte<K extends ReporteRecurso>(
  recurso: K,
  anio?: number,
): Promise<ReporteDataMap[K]> {
  const res = await apiRequest<ApiItemResponse<ReporteDataMap[K]>>(`/reportes/${recurso}`, {
    params: recurso === 'protocolos-por-mes' && anio ? { anio } : undefined,
  });
  return res.data;
}

export async function exportReporteCsv(recurso: ReporteRecurso, anio?: number): Promise<void> {
  await apiDownload(
    `/reportes/exportar/csv/${recurso}`,
    recurso === 'protocolos-por-mes' && anio ? { anio } : undefined,
    `reporte-${recurso}.csv`,
  );
}

export async function exportReporteExcel(recurso: ReporteRecurso, anio?: number): Promise<void> {
  await apiDownload(
    `/reportes/exportar/excel/${recurso}`,
    recurso === 'protocolos-por-mes' && anio ? { anio } : undefined,
    `reporte-${recurso}.xlsx`,
  );
}
