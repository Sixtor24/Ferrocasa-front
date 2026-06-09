import { apiRequest } from '../client';
import type { ApiItemResponse } from '../types';
import type {
  DashboardActividadApi,
  DashboardAlertasApi,
  DashboardGraficosApi,
  DashboardStatsApi,
} from '../../types/dashboard';

export async function fetchDashboardStats() {
  const res = await apiRequest<ApiItemResponse<DashboardStatsApi>>('/dashboard/stats');
  return res.data;
}

export async function fetchDashboardActividadReciente(limit = 15) {
  const res = await apiRequest<ApiItemResponse<DashboardActividadApi>>('/dashboard/actividad-reciente', {
    params: { limit },
  });
  return res.data;
}

export async function fetchDashboardAlertas() {
  const res = await apiRequest<ApiItemResponse<DashboardAlertasApi>>('/dashboard/alertas');
  return res.data;
}

export async function fetchDashboardGraficos(anio?: number) {
  const res = await apiRequest<ApiItemResponse<DashboardGraficosApi>>('/dashboard/graficos', {
    params: anio ? { anio } : undefined,
  });
  return res.data;
}
