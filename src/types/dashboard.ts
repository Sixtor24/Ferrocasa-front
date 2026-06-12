import type { AuditoriaAccion } from './auditoria';

export type DashboardChartSeries = {
  labels: string[];
  values: number[];
};

export type DashboardStatsApi = {
  inventario: {
    bienes_edificio_administrativo: number;
    bienes_cementerio: number;
    parcelas: number;
    vehiculos_maquinarias: number;
  };
  valoracion_total: number;
  actividad: {
    cambios_ultimos_7_dias: number;
    protocolos_mes_actual: number;
    usuarios_activos: number;
  };
  indicadores: {
    parcelas_disponibles: number;
    vehiculos_disponibles: number;
    bienes_almacenados: number;
  };
};

export type DashboardActividadItem = {
  id_auditoria: number | string;
  nombre_tabla: string;
  id_registro: number | string;
  accion: AuditoriaAccion;
  fecha_cambio: string;
  usuario?: {
    nombre_usuario?: string;
    id_usuario?: number;
    rol?: { nombre_rol?: string };
  };
};

export type DashboardActividadApi = {
  data: DashboardActividadItem[];
  total: number;
};

export type DashboardAlertaTipo = 'danger' | 'warning' | 'info';

export type DashboardAlerta = {
  tipo: DashboardAlertaTipo;
  codigo: string;
  titulo: string;
  mensaje: string;
  cantidad: number;
};

export type DashboardAlertasApi = {
  data: DashboardAlerta[];
  total: number;
  resumen: {
    criticas: number;
    advertencias: number;
    informativas: number;
  };
};

export type DashboardGraficosApi = {
  anio: number;
  parcelas_por_zona: DashboardChartSeries;
  bienes_por_almacen: DashboardChartSeries;
  vehiculos_por_estado: DashboardChartSeries;
  protocolos_por_mes: DashboardChartSeries;
  auditoria_ultimos_30_dias: DashboardChartSeries;
};
