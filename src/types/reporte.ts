// Reportes y auditoría

export type TipoMovimiento = 'Entrada' | 'Salida' | 'Traslado' | 'Baja' | 'Asignación' | 'Corrección' | 'Importación';
export type ModuloSistema = 'Bienes' | 'Cementerio' | 'Inmuebles' | 'Vehículos' | 'Ventas' | 'Sistema';

export interface MovimientoAuditoria {
  id: number;
  fecha: string;
  hora: string;
  usuario: string;
  iniciales: string;
  modulo: ModuloSistema;
  tipoMovimiento: TipoMovimiento;
  descripcion: string;
  registroAfectado: string;
  ip: string;
}

export interface ReporteExportable {
  id: string;
  titulo: string;
  modulo: ModuloSistema;
  tipo: 'PDF' | 'Excel' | 'CSV';
  fechaGeneracion: string;
  registros: number;
  generadoPor: string;
}
