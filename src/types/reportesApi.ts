export type ReporteRecurso =
  | 'parcelas-por-zona'
  | 'parcelas-por-responsable'
  | 'bienes-por-almacen'
  | 'vehiculos-por-estado'
  | 'resumen-general'
  | 'inventario-valorado'
  | 'protocolos-por-mes';

export interface ReporteParcelasPorZona {
  total_parcelas: number;
  valor_total: number;
  data: Array<{ zona: string; total: number; valor_total: number }>;
}

export interface ReporteParcelasPorResponsable {
  total_parcelas: number;
  valor_total: number;
  data: Array<{
    ci_responsable: string;
    nombre_responsable: string;
    departamento: string;
    total: number;
    valor_total: number;
  }>;
}

export interface ReporteBienesPorAlmacen {
  total_bienes: number;
  valor_total: number;
  data: Array<{
    id_almacen: number;
    nombre_almacen: string;
    sede: string;
    total: number;
    valor_total: number;
  }>;
}

export interface ReporteVehiculosPorEstado {
  total_vehiculos: number;
  valor_total: number;
  data: Array<{
    estado_vehiculo: string;
    total: number;
    valor_total: number;
  }>;
}

export interface ReporteResumenGeneral {
  inventario: {
    parcelas: number;
    bienes: number;
    vehiculos: number;
    propiedades: number;
    almacenes: number;
    protocolos: number;
  };
  parcelas: {
    disponibles: number;
    comprometidas: number;
    desincorporadas: number;
  };
  valoracion: {
    parcelas: number;
    bienes: number;
    vehiculos: number;
    total_general: number;
  };
}

export interface ReporteInventarioValorado {
  bienes: Record<string, unknown>;
  vehiculos: Record<string, unknown>;
  parcelas: Record<string, unknown>;
  resumen: {
    total_activos: number;
    valor_total_general: number;
  };
}

export interface ReporteProtocolosPorMes {
  anio: number;
  data: Array<{
    anio: number;
    mes: number;
    mes_label: string;
    total_protocolos: number;
    por_motivo: Record<string, number>;
  }>;
  resumen: Record<string, number>;
}

export type ReporteDataMap = {
  'parcelas-por-zona': ReporteParcelasPorZona;
  'parcelas-por-responsable': ReporteParcelasPorResponsable;
  'bienes-por-almacen': ReporteBienesPorAlmacen;
  'vehiculos-por-estado': ReporteVehiculosPorEstado;
  'resumen-general': ReporteResumenGeneral;
  'inventario-valorado': ReporteInventarioValorado;
  'protocolos-por-mes': ReporteProtocolosPorMes;
};

export type ReporteTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: 'money' | 'number' | 'text';
};

export type ReporteTableRow = Record<string, string | number>;

export type ReporteTotales = Array<{ label: string; value: string }>;
